import "dotenv/config";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth as getAdminAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const port = Number(process.env.API_PORT || 3001);
const maxPortfolioImageSize = 5 * 1024 * 1024;
const maxPortfolioImageCount = 6;
const maxPropertySubmissionImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const requiredEnvironmentVariables = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
  "AWS_REGION",
  "FIREBASE_API_KEY",
] as const;

function getEnvironment(name: (typeof requiredEnvironmentVariables)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise.`);
  }
  return value;
}

function getS3Client(): S3Client {
  return new S3Client({
    region: getEnvironment("AWS_REGION"),
    credentials: {
      accessKeyId: getEnvironment("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getEnvironment("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

interface AuthenticatedRequest extends Request {
  userId?: string;
  decodedToken?: DecodedIdToken;
}

function getFirebaseServiceAccount() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawServiceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON est requis pour les opérations Firebase sécurisées de l'API locale."
    );
  }

  try {
    const serviceAccount = JSON.parse(rawServiceAccount);
    if (
      typeof serviceAccount.project_id !== "string" ||
      typeof serviceAccount.client_email !== "string" ||
      typeof serviceAccount.private_key !== "string"
    ) {
      throw new Error("Le compte de service Firebase est incomplet.");
    }
    return serviceAccount;
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_JSON est invalide : ${
        error instanceof Error ? error.message : "format JSON incorrect"
      }`
    );
  }
}

function getFirebaseAdmin() {
  if (!getApps().length) initializeApp({ credential: cert(getFirebaseServiceAccount()) });
  return { auth: getAdminAuth(), firestore: getAdminFirestore() };
}

async function authenticateFirebaseUser(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const token = request.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    response.status(401).json({ error: "Authentification requise." });
    return;
  }

  try {
    const decodedToken = await getFirebaseAdmin().auth.verifyIdToken(token);
    request.userId = decodedToken.uid;
    request.decodedToken = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    response.status(503).json({
      error: error instanceof Error
        ? error.message
        : "La vérification de session est temporairement indisponible.",
    });
  }
}

async function requireApprovedProfessional(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  if (!request.userId) {
    response.status(401).json({ error: "Authentification requise." });
    return;
  }

  try {
    const { firestore } = getFirebaseAdmin();
    const accounts = await firestore
      .collection("professionalAccounts")
      .where("uid", "==", request.userId)
      .limit(1)
      .get();
    if (accounts.empty) {
      response.status(403).json({ error: "Cette action est réservée aux prestataires approuvés." });
      return;
    }

    const account = accounts.docs[0].data();
    let status = String(account.status || "");
    if (typeof account.applicationId === "string" && account.applicationId) {
      const application = await firestore.collection("professionalApplications").doc(account.applicationId).get();
      if (application.exists) status = String(application.data()?.status || status);
    }

    const approvedByApplication = ["Confirmé", "Approuvé", "Approuve"].includes(status);
    const approvedProviderByApplication = typeof account.applicationId === "string" && account.applicationId
      ? await firestore.collection("providers")
        .where("applicationId", "==", account.applicationId)
        .where("verified", "==", true)
        .limit(1)
        .get()
      : null;
    const approvedProviderByEmail = request.decodedToken?.email
      ? await firestore.collection("providers")
        .where("email", "==", request.decodedToken.email.toLowerCase())
        .where("verified", "==", true)
        .limit(1)
        .get()
      : null;
    if (!approvedByApplication &&
        (!approvedProviderByApplication || approvedProviderByApplication.empty) &&
        (!approvedProviderByEmail || approvedProviderByEmail.empty)) {
      response.status(403).json({ error: "Votre dossier prestataire doit être approuvé avant l'envoi de photos." });
      return;
    }
    next();
  } catch (error) {
    console.error("Professional approval verification failed:", error);
    response.status(503).json({ error: "La vérification du dossier prestataire est temporairement indisponible." });
  }
}

function isPublishedAndAvailable(maison: Record<string, unknown>): boolean {
  const approved = maison.approuvee === true || maison.approuvee === "true" ||
    maison.approuvee === 1 || maison.statut === "approuvee" || maison.statut === "approuve";
  const availability = String(maison.disponibilite ?? maison.availability ?? "").toLowerCase();
  const status = String(maison.statut ?? "").toLowerCase();
  return approved && maison.disponibilite !== false &&
    !["indisponible", "reservee", "réservée", "booked"].includes(availability) &&
    !["indisponible", "reservee", "réservée"].includes(status);
}

const app = express();
app.use(express.json({ limit: "32kb" }));

app.get("/api/properties", async (_request, response) => {
  try {
    const snapshot = await getFirebaseAdmin().firestore.collection("maisons").get();
    const properties = snapshot.docs
      .filter((document) => isPublishedAndAvailable(document.data()))
      .map((document) => ({ id: document.id, data: document.data() }));
    response.json({ properties });
  } catch (error) {
    console.error("Public property listing failed:", error);
    response.status(503).json({ error: "Le catalogue immobilier est temporairement indisponible." });
  }
});

app.post("/api/professional-session", authenticateFirebaseUser, async (request: AuthenticatedRequest, response) => {
  try {
    const { firestore } = getFirebaseAdmin();
    const directAccount = await firestore.collection("professionalAccounts").doc(request.userId).get();
    const account = directAccount.exists
      ? directAccount
      : (await firestore.collection("professionalAccounts").where("uid", "==", request.userId).limit(1).get()).docs[0];
    if (!account?.exists) {
      response.status(404).json({ error: "Aucun compte prestataire ne correspond à cette session." });
      return;
    }

    const accountData = account.data()!;
    const directApplication = typeof accountData.applicationId === "string" && accountData.applicationId
      ? await firestore.collection("professionalApplications").doc(accountData.applicationId).get()
      : undefined;
    const application = directApplication?.exists
      ? directApplication
      : (await firestore.collection("professionalApplications").where("session.uid", "==", request.userId).limit(1).get()).docs[0];
    const applicationData = application?.exists ? application.data() : undefined;
    const applicationId = application?.id || accountData.applicationId;
    const verifiedProviders = applicationId
      ? await firestore.collection("providers").where("applicationId", "==", applicationId).where("verified", "==", true).limit(1).get()
      : await firestore.collection("providers").where("email", "==", request.decodedToken?.email?.toLowerCase() || "").where("verified", "==", true).limit(1).get();
    const provider = verifiedProviders.empty ? undefined : verifiedProviders.docs[0];
    const normalizeStatus = (value: unknown) => {
      const status = String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (["refuse", "rejete", "rejected", "declined"].includes(status)) return "Refusé";
      if (["confirme", "approuve", "approved"].includes(status)) return "Confirmé";
      return "En attente";
    };
    const status = provider?.data().verified === true
      ? "Confirmé"
      : normalizeStatus(applicationData?.status) === "Refusé" || normalizeStatus(accountData.status) === "Refusé"
        ? "Refusé"
        : normalizeStatus(applicationData?.status) === "Confirmé" || normalizeStatus(accountData.status) === "Confirmé"
          ? "Confirmé"
          : "En attente";
    response.json({
      email: String(accountData.email || request.decodedToken?.email || ""),
      fullName: String(accountData.fullName || ""),
      specialty: typeof accountData.specialty === "string" ? accountData.specialty : undefined,
      providerStatus: status,
      providerListing: provider ? { ...provider.data(), id: provider.id } : undefined,
    });
  } catch (error) {
    console.error("Professional session lookup failed:", error);
    response.status(503).json({ error: "Le statut prestataire est temporairement indisponible." });
  }
});

app.post("/api/property-bookings", authenticateFirebaseUser, async (request: AuthenticatedRequest, response) => {
  const { propertyId, clientName, clientPhone, visitDate, visitTime } = request.body ?? {};
  if (![propertyId, clientName, clientPhone, visitDate, visitTime].every((value) => typeof value === "string" && value.trim())) {
    response.status(400).json({ error: "Les informations de réservation sont incomplètes." });
    return;
  }
  const normalizedClientPhone = clientPhone.trim().replace(/[^\d+]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedClientPhone)) {
    response.status(400).json({ error: "Le numéro WhatsApp doit contenir son indicatif international, par exemple +243 857068014." });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !/^\d{2}:\d{2}$/.test(visitTime)) {
    response.status(400).json({ error: "La date ou l'heure de visite est invalide." });
    return;
  }

  try {
    const { firestore } = getFirebaseAdmin();
    const maisonRef = firestore.collection("maisons").doc(propertyId);
    const bookingRef = firestore.collection("propertyBookings").doc();
    await firestore.runTransaction(async (transaction) => {
      const maisonSnapshot = await transaction.get(maisonRef);
      if (!maisonSnapshot.exists || !isPublishedAndAvailable(maisonSnapshot.data()!)) {
        throw new Error("Cette maison n'est plus disponible.");
      }
      const maison = maisonSnapshot.data()!;
      const imageUrls = Array.isArray(maison.photo_urls) ? maison.photo_urls : Array.isArray(maison.imageUrls) ? maison.imageUrls : [];
      transaction.set(bookingRef, {
        serviceType: "Immobilier",
        itemName: String(maison.titre || "Maison"),
        status: "En attente",
        statut: "En attente",
        clientUid: request.userId,
        clientId: request.userId,
        clientName: clientName.trim(),
        nom_client: clientName.trim(),
        clientEmail: request.decodedToken?.email || null,
        clientWhatsApp: normalizedClientPhone,
        telephone_client: normalizedClientPhone,
        propertyId,
        bien_id: propertyId,
        type_bien: "maison",
        titre_bien: String(maison.titre || "Maison"),
        photo_bien: String(maison.photo_url || imageUrls[0] || ""),
        photo_urls: imageUrls,
        localisation: String(maison.commune || maison.adresse || ""),
        prix: Number(maison.prix || 0),
        devise: String(maison.devise || "$"),
        description: String(maison.description || ""),
        informations_complementaires: typeof maison.informations_complementaires === "string" ? maison.informations_complementaires : null,
        visitDate,
        visitTime,
        date: visitDate,
        date_reservation: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        acknowledgedByClient: false,
      });
      transaction.update(maisonRef, { disponibilite: "indisponible", availability: "unavailable" });
    });
    response.status(201).json({ id: bookingRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La réservation n'a pas pu être enregistrée.";
    response.status(message.includes("plus disponible") ? 409 : 500).json({ error: message });
  }
});

app.post("/api/property-submissions", authenticateFirebaseUser, async (request: AuthenticatedRequest, response) => {
  const allowed = ["category", "reporterPhone", "country", "province", "commune", "quartier", "avenue"];
  const body = request.body ?? {};
  const normalizedReporterPhone = typeof body.reporterPhone === "string"
    ? body.reporterPhone.trim().replace(/[^\d+]/g, "")
    : "";
  if (!["Villa", "Terrain", "Appartement", "Studio", "Bureau", "Maison"].includes(body.category) ||
      !["reporterPhone", "country", "province", "commune", "quartier", "avenue"].every((key) => typeof body[key] === "string" && body[key].trim()) ||
      !/^\+[1-9]\d{7,14}$/.test(normalizedReporterPhone)) {
    response.status(400).json({ error: "Veuillez renseigner le type de bien, son adresse complète et votre numéro WhatsApp." });
    return;
  }
  if (typeof body.submissionRequestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionRequestId)) {
    response.status(400).json({ error: "La demande de soumission est invalide. Veuillez réessayer." });
    return;
  }
  try {
    const bucket = getEnvironment("AWS_BUCKET_NAME");
    const region = getEnvironment("AWS_REGION");
    const referencePhotoPrefix = `https://${bucket}.s3.${region}.amazonaws.com/goying/property-submissions/${request.userId}/`;
    if (typeof body.referencePhotoUrl !== "string" || !body.referencePhotoUrl.startsWith(referencePhotoPrefix)) {
      response.status(400).json({ error: "Veuillez ajouter une photo de référence valide de la maison." });
      return;
    }
    const submission = {
      ...Object.fromEntries(allowed.filter((key) => body[key] !== undefined).map((key) => [key, body[key]])),
      reporterPhone: normalizedReporterPhone,
    };
    const { firestore } = getFirebaseAdmin();
    const userProfile = request.decodedToken?.email
      ? await firestore.collection("users").doc(request.decodedToken.email.toLowerCase()).get()
      : null;
    const reporterName = userProfile?.exists && typeof userProfile.data()?.fullName === "string"
      ? userProfile.data()!.fullName.trim()
      : "";
    if (!reporterName) {
      response.status(400).json({ error: "Votre nom est introuvable dans votre profil. Reconnectez-vous puis réessayez." });
      return;
    }
    const ref = firestore.collection("propertySubmissions").doc(body.submissionRequestId);
    const created = await firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) {
        if (existing.data().reporterUid !== request.userId) {
          throw new Error("Cette demande de soumission ne vous appartient pas.");
        }
        return false;
      }
      transaction.create(ref, {
        ...submission,
        reporterUid: request.userId,
        reporterEmail: request.decodedToken?.email || null,
        reporterName,
        referencePhotoUrl: body.referencePhotoUrl,
        status: "en_attente",
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    response.status(created ? 201 : 200).json({ id: ref.id });
  } catch (error) {
    console.error("Property submission failed:", error);
    response.status(500).json({ error: error instanceof Error ? error.message : "La soumission n'a pas pu être envoyée." });
  }
});

app.post("/api/property-submission-uploads", authenticateFirebaseUser, async (request: AuthenticatedRequest, response) => {
  const image = request.body?.image;
  if (!image || typeof image.contentType !== "string" || !allowedImageTypes.has(image.contentType)) {
    response.status(400).json({ error: "Seules les images JPEG, PNG et WebP sont acceptées." });
    return;
  }

  try {
    const bucket = getEnvironment("AWS_BUCKET_NAME");
    const region = getEnvironment("AWS_REGION");
    const extension = image.contentType.split("/")[1];
    const key = `goying/property-submissions/${request.userId}/${crypto.randomUUID()}.${extension}`;
    const upload = await createPresignedPost(getS3Client(), {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ["content-length-range", 1, maxPropertySubmissionImageSize],
        { "Content-Type": image.contentType },
      ],
      Fields: { "Content-Type": image.contentType },
      Expires: 300,
    });
    response.json({
      upload: {
        ...upload,
        publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      },
    });
  } catch (error) {
    console.error("Property submission image upload preparation failed:", error);
    response.status(500).json({ error: "Impossible de préparer l'envoi de la photo de référence." });
  }
});

app.post("/api/booking-reviews", authenticateFirebaseUser, async (request: AuthenticatedRequest, response) => {
  const { bookingId, rating, comment } = request.body ?? {};
  if (typeof bookingId !== "string" || !bookingId.trim() || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      (typeof comment !== "string" && comment !== undefined) || (typeof comment === "string" && comment.trim().length > 1000)) {
    response.status(400).json({ error: "La note ou le commentaire est invalide." });
    return;
  }

  try {
    const { firestore } = getFirebaseAdmin();
    const bookingCollections = ["bookings", "carBookings", "propertyBookings"] as const;
    const result = await firestore.runTransaction(async (transaction) => {
      const candidates = await Promise.all(bookingCollections.map(async (collectionName) => {
        const ref = firestore.collection(collectionName).doc(bookingId);
        return { collectionName, ref, snapshot: await transaction.get(ref) };
      }));
      const bookingRecord = candidates.find((candidate) => candidate.snapshot.exists);
      if (!bookingRecord) throw new Error("Réservation introuvable.");

      const booking = bookingRecord.snapshot.data()!;
      if (booking.status !== "Terminé") {
        throw new Error("Un avis peut être laissé uniquement après la fin de la prestation.");
      }
      const bookingClientUid = String(booking.clientUid ?? booking.clientId ?? "");
      const bookingClientEmail = String(booking.clientEmail ?? "").toLowerCase();
      if (bookingClientUid !== request.userId && bookingClientEmail !== request.decodedToken?.email?.toLowerCase()) {
        throw new Error("Vous ne pouvez évaluer que vos propres réservations.");
      }
      if ((booking.providerCollection !== "chauffeurs" && booking.providerCollection !== "providers") ||
          typeof booking.providerId !== "string" || !booking.providerId) {
        throw new Error("Cette réservation ne peut pas recevoir d'avis.");
      }

      const reviewRef = firestore.collection("reviews").doc(`${bookingRecord.collectionName}_${bookingId}`);
      const existingReview = await transaction.get(reviewRef);
      if (existingReview.exists || booking.reviewedAt) {
        throw new Error("Un avis a déjà été enregistré pour cette réservation.");
      }

      const providerRef = firestore.collection(booking.providerCollection).doc(booking.providerId);
      const providerSnapshot = await transaction.get(providerRef);
      if (!providerSnapshot.exists) throw new Error("Prestataire introuvable.");

      const provider = providerSnapshot.data()!;
      const currentRating = Number(provider.rating ?? provider.note ?? 0);
      const currentReviewsCount = Number(provider.reviewsCount ?? provider.avis ?? 0);
      const reviewsCount = currentReviewsCount + 1;
      const averageRating = Number(((currentRating * currentReviewsCount + rating) / reviewsCount).toFixed(1));
      const now = FieldValue.serverTimestamp();

      transaction.create(reviewRef, {
        bookingId,
        bookingCollection: bookingRecord.collectionName,
        clientUid: request.userId,
        providerId: booking.providerId,
        providerCollection: booking.providerCollection,
        rating,
        comment: typeof comment === "string" ? comment.trim() : "",
        createdAt: now,
      });
      transaction.update(providerRef, { rating: averageRating, reviewsCount });
      transaction.update(bookingRecord.ref, { reviewedAt: now });
      return { rating: averageRating, reviewsCount };
    });
    response.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Votre avis n'a pas pu être enregistré.";
    const status = message.includes("déjà") ? 409 : message.includes("terminée") || message.includes("propres") || message.includes("peut pas") ? 403 : 500;
    response.status(status).json({ error: message });
  }
});

app.post("/api/portfolio-uploads", authenticateFirebaseUser, requireApprovedProfessional, async (request: AuthenticatedRequest, response) => {
  const images = request.body?.images;
  const uploadType = request.body?.uploadType;
  if (uploadType !== "portfolio" && uploadType !== "avatar") {
    response.status(400).json({ error: "Type d'image invalide." });
    return;
  }
  const maximumImageCount = uploadType === "avatar" ? 1 : maxPortfolioImageCount;
  if (!Array.isArray(images) || images.length === 0 || images.length > maximumImageCount) {
    response.status(400).json({ error: `Envoyez entre 1 et ${maximumImageCount} image${maximumImageCount > 1 ? "s" : ""}.` });
    return;
  }

  if (images.some((image) => !allowedImageTypes.has(image?.contentType))) {
    response.status(400).json({ error: "Seules les images JPEG, PNG et WebP sont acceptées." });
    return;
  }

  try {
    const bucket = getEnvironment("AWS_BUCKET_NAME");
    const region = getEnvironment("AWS_REGION");
    const uploads = await Promise.all(images.map(async (image) => {
      const extension = image.contentType.split("/")[1];
      const key = `goying/${uploadType === "avatar" ? "avatars" : "portfolios"}/${request.userId}/${crypto.randomUUID()}.${extension}`;
      const signedPost = await createPresignedPost(getS3Client(), {
        Bucket: bucket,
        Key: key,
        Conditions: [
          ["content-length-range", 1, maxPortfolioImageSize],
          { "Content-Type": image.contentType },
        ],
        Fields: { "Content-Type": image.contentType },
        Expires: 300,
      });
      return {
        ...signedPost,
        publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      };
    }));
    response.json({ uploads });
  } catch (error) {
    console.error("S3 signed upload generation failed:", error);
    response.status(500).json({
      error: error instanceof Error
        ? `Impossible de préparer l'envoi des images vers S3 : ${error.message}`
        : "Impossible de préparer l'envoi des images vers S3.",
    });
  }
});

app.listen(port, () => {
  console.log(`Portfolio upload API listening on http://localhost:${port}`);
});
