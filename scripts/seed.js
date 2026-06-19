import dotenv from "dotenv";
import connection from "../utils/DB.js";
import AuthService from "../services/AuthService.js";

dotenv.config();

const seed = async () => {
  const { SEED_SUPER_ADMIN_NAME, SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD } =
    process.env;

  if (!SEED_SUPER_ADMIN_EMAIL || !SEED_SUPER_ADMIN_PASSWORD) {
    console.error(
      "Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD in .env"
    );
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("Set JWT_SECRET in .env");
    process.exit(1);
  }

  await connection();

  const superAdmin = await AuthService.seedSuperAdmin({
    name: SEED_SUPER_ADMIN_NAME ?? "Super Admin",
    email: SEED_SUPER_ADMIN_EMAIL,
    password: SEED_SUPER_ADMIN_PASSWORD,
  });

  console.log("Super admin seeded:", superAdmin.email);
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
