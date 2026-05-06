import bcrypt from 'bcryptjs'
import { PrismaClient, RoleName } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const roles = [
    RoleName.PATIENT,
    RoleName.HOSPITAL_ADMIN,
    RoleName.HOSPITAL_STAFF,
    RoleName.PLATFORM_ADMIN,
    RoleName.SUPER_ADMIN,
  ]

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
    })
  }

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@careos.com'
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345'

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      primaryRole: RoleName.PLATFORM_ADMIN,
      status: 'ACTIVE',
    },
  })

  const platformAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.PLATFORM_ADMIN },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: platformAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: platformAdminRole.id,
    },
  })

  console.log('careOS database seeded successfully.')
  console.log(`Default admin email: ${adminEmail}`)
  console.log(`Default admin password: ${adminPassword}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })