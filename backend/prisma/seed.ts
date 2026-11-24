import { PrismaClient, Role, Priority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WorkSphere database...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Platform Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@worksphere.io' },
    update: {},
    create: {
      email: 'admin@worksphere.io',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,
      isPlatformAdmin: true,
    },
  });

  // 2. Create Users
  const userOwner = await prisma.user.upsert({
    where: { email: 'owner@tayana.com' },
    update: {},
    create: {
      email: 'owner@tayana.com',
      firstName: 'Vaishnvi',
      lastName: 'Goswami',
      passwordHash,
    },
  });

  const userPM = await prisma.user.upsert({
    where: { email: 'pm@tayana.com' },
    update: {},
    create: {
      email: 'pm@tayana.com',
      firstName: 'Rahul',
      lastName: 'Sharma',
      passwordHash,
    },
  });

  const userMember = await prisma.user.upsert({
    where: { email: 'dev@tayana.com' },
    update: {},
    create: {
      email: 'dev@tayana.com',
      firstName: 'Aman',
      lastName: 'Verma',
      passwordHash,
    },
  });

  const userAuditor = await prisma.user.upsert({
    where: { email: 'auditor@tayana.com' },
    update: {},
    create: {
      email: 'auditor@tayana.com',
      firstName: 'Sneha',
      lastName: 'Kapoor',
      passwordHash,
    },
  });

  // 3. Create Multi-Tenant Organizations
  const orgTayana = await prisma.organization.upsert({
    where: { slug: 'tayana-solutions' },
    update: {},
    create: {
      name: 'Tayana Solutions',
      slug: 'tayana-solutions',
      plan: 'ENTERPRISE',
      members: {
        create: [
          { userId: userOwner.id, role: Role.OWNER },
          { userId: userPM.id, role: Role.PROJECT_MANAGER },
          { userId: userMember.id, role: Role.MEMBER },
          { userId: userAuditor.id, role: Role.AUDITOR },
        ],
      },
    },
  });

  const orgAcme = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'PRO',
      members: {
        create: [
          { userId: userOwner.id, role: Role.MEMBER },
        ],
      },
    },
  });

  // 4. Create Project
  const project = await prisma.project.create({
    data: {
      organizationId: orgTayana.id,
      name: 'WorkSphere Core Platform',
      key: 'WSC',
      description: 'Enterprise multi-tenant workflow and task management suite',
      priority: Priority.HIGH,
      ownerId: userOwner.id,
      milestones: {
        create: [
          { title: 'MVP Release - Auth & Tasks', dueDate: new Date(Date.now() + 14 * 86400000) },
          { title: 'Analytics & Webhooks', dueDate: new Date(Date.now() + 30 * 86400000) },
        ],
      },
    },
    include: { milestones: true },
  });

  // 5. Create Sample Tasks with OCC version = 1
  await prisma.task.createMany({
    data: [
      {
        organizationId: orgTayana.id,
        projectId: project.id,
        milestoneId: project.milestones[0]?.id,
        title: 'Design Database Schema & Migration files',
        description: 'PostgreSQL schema with OCC versioning and tenant foreign keys',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        reporterId: userOwner.id,
        assigneeId: userMember.id,
        version: 1,
        position: 1000,
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        organizationId: orgTayana.id,
        projectId: project.id,
        milestoneId: project.milestones[0]?.id,
        title: 'Build Express REST API with Role-Based Permissions',
        description: 'JWT refresh token rotation, tenant isolation, and audit logging',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        reporterId: userPM.id,
        assigneeId: userMember.id,
        version: 1,
        position: 2000,
        estimatedHours: 16,
      },
      {
        organizationId: orgTayana.id,
        projectId: project.id,
        milestoneId: project.milestones[1]?.id,
        title: 'Implement FastAPI Analytics Service',
        description: 'Chunked stream export and cycle time calculations in Python',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        reporterId: userPM.id,
        version: 1,
        position: 3000,
        estimatedHours: 12,
      },
    ],
  });

  console.log('Database seeded successfully with demo users:');
  console.log(' - Admin: admin@worksphere.io / Password@123');
  console.log(' - Owner: owner@tayana.com / Password@123');
  console.log(' - PM: pm@tayana.com / Password@123');
  console.log(' - Member: dev@tayana.com / Password@123');
  console.log(' - Auditor: auditor@tayana.com / Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
