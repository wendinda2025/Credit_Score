import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto, CreateOfficeDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        offices: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organisation avec l'ID ${id} introuvable`);
    }

    return org;
  }

  async createOffice(organizationId: string, createDto: CreateOfficeDto) {
    return this.prisma.office.create({
      data: {
        ...createDto,
        organizationId,
      },
    });
  }

  async findAllOffices(organizationId: string) {
    return this.prisma.office.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });
  }
}
