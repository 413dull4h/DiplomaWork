-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "profile_image_url" TEXT;

-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "profile_image_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT;
