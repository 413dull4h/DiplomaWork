import bcrypt from 'bcryptjs'
import {
  PrismaClient,
  LabStaffRole,
  LabStatus,
  LabType,
  RoleName,
  UserStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'lab.admin@careos.com'
  const password = 'Lab@12345'

  const role = await prisma.role.upsert({
    where: {
      name: RoleName.LAB_ADMIN,
    },
    update: {},
    create: {
      name: RoleName.LAB_ADMIN,
      description: 'Lab administrator',
    },
  })

  const hospital = await prisma.hospital.findFirst({
    where: {
      status: 'APPROVED',
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  let lab = await prisma.lab.findFirst({
    where: {
      name: 'CareOS Diagnostic Lab',
      deletedAt: null,
    },
  })

  if (!lab) {
    lab = await prisma.lab.create({
      data: {
        name: 'CareOS Diagnostic Lab',
        legalName: 'CareOS Diagnostic Lab Ltd',
        type: hospital ? LabType.INTERNAL : LabType.INDEPENDENT,
        status: LabStatus.APPROVED,
        hospitalId: hospital?.id,
        contactEmail: 'lab@careos.com',
        contactPhone: '+8801722222222',
        licenseNumber: 'LAB-001',
        accreditation: 'Demo accreditation',
        workingHours: '09:00 - 18:00',
        description: 'Demo diagnostic lab for careOS MVP testing.',
      },
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      passwordHash,
      status: UserStatus.ACTIVE,
      primaryRole: RoleName.LAB_ADMIN,
    },
    create: {
      email,
      passwordHash,
      status: UserStatus.ACTIVE,
      primaryRole: RoleName.LAB_ADMIN,
      userRoles: {
        create: {
          roleId: role.id,
        },
      },
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  })

  await prisma.labStaff.upsert({
    where: {
      userId_labId: {
        userId: user.id,
        labId: lab.id,
      },
    },
    update: {
      staffRole: LabStaffRole.LAB_ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      userId: user.id,
      labId: lab.id,
      staffRole: LabStaffRole.LAB_ADMIN,
      isActive: true,
    },
  })

  console.log('Demo lab created/updated:')
  console.log(`Lab: ${lab.name}`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })