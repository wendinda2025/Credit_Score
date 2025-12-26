import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async createIndividual(orgId: string, input: any) {
    return await this.prisma.client.create({
      data: {
        organizationId: orgId,
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        externalId: input.externalId,
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        language: input.language ?? 'FR',
        individual: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
          },
        },
      },
      include: { individual: true },
    });
  }

  async createGroup(orgId: string, input: any) {
    return await this.prisma.client.create({
      data: {
        organizationId: orgId,
        type: 'GROUP',
        status: 'ACTIVE',
        externalId: input.externalId,
        displayName: input.displayName,
        group: { create: { meetingDay: input.meetingDay } },
      },
      include: { group: true },
    });
  }

  async createBusiness(orgId: string, input: any) {
    return await this.prisma.client.create({
      data: {
        organizationId: orgId,
        type: 'BUSINESS',
        status: 'ACTIVE',
        externalId: input.externalId,
        displayName: input.displayName,
        business: {
          create: {
            legalName: input.legalName,
            registrationNo: input.registrationNo,
          },
        },
      },
      include: { business: true },
    });
  }

  async list(orgId: string) {
    return await this.prisma.client.findMany({
      where: { organizationId: orgId },
      include: { individual: true, group: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const c = await this.prisma.client.findFirst({
      where: { organizationId: orgId, id },
      include: { individual: true, group: true, business: true, kycDocuments: true },
    });
    if (!c) throw new NotFoundException('Client introuvable.');
    return c;
  }

  async setStatus(orgId: string, id: string, status: any) {
    const c = await this.prisma.client.findFirst({ where: { organizationId: orgId, id } });
    if (!c) throw new NotFoundException('Client introuvable.');
    return await this.prisma.client.update({ where: { id }, data: { status } });
  }

  async addKycDocument(orgId: string, clientId: string, input: any) {
    const c = await this.prisma.client.findFirst({ where: { organizationId: orgId, id: clientId } });
    if (!c) throw new NotFoundException('Client introuvable.');
    return await this.prisma.kycDocument.create({
      data: {
        clientId,
        type: input.type,
        fileName: input.fileName,
        mimeType: input.mimeType,
      },
    });
  }
}

