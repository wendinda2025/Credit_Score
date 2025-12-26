import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, AddGroupMemberDto } from './dto/client.dto';
import { ClientType, ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async generateClientNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.client.count({
      where: { organizationId },
    });
    return `CLI-${String(count + 1).padStart(8, '0')}`;
  }

  async create(createClientDto: CreateClientDto, userId: string) {
    // Générer le numéro de client
    const clientNumber = await this.generateClientNumber(
      createClientDto.organizationId,
    );

    // Validation selon le type
    if (createClientDto.type === ClientType.INDIVIDUAL) {
      if (!createClientDto.firstName || !createClientDto.lastName) {
        throw new BadRequestException(
          'Le prénom et le nom sont requis pour une personne physique',
        );
      }
    } else if (createClientDto.type === ClientType.BUSINESS) {
      if (!createClientDto.businessName) {
        throw new BadRequestException(
          'Le nom de l\'entreprise est requis',
        );
      }
    }

    const client = await this.prisma.client.create({
      data: {
        ...createClientDto,
        clientNumber,
        createdBy: userId,
        dateOfBirth: createClientDto.dateOfBirth
          ? new Date(createClientDto.dateOfBirth)
          : null,
      },
      include: {
        organization: true,
        office: true,
        groupMembers: {
          include: {
            member: true,
          },
        },
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: createClientDto.organizationId,
        action: 'CREATE',
        entityType: 'CLIENT',
        entityId: client.id,
        description: `Création du client ${clientNumber}`,
      },
    });

    return client;
  }

  async findAll(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.search) {
      where.OR = [
        { clientNumber: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: {
        office: true,
        groupMembers: {
          include: {
            member: true,
          },
        },
        _count: {
          select: {
            loans: true,
            savings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        organization: true,
        office: true,
        groupMembers: {
          include: {
            member: true,
          },
        },
        loans: {
          include: {
            loanProduct: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        savings: {
          include: {
            savingsProduct: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId: string) {
    const client = await this.findOne(id);

    const updateData: any = { ...updateClientDto };
    if (updateClientDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateClientDto.dateOfBirth);
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        office: true,
        groupMembers: {
          include: {
            member: true,
          },
        },
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: client.organizationId,
        action: 'UPDATE',
        entityType: 'CLIENT',
        entityId: id,
        description: `Modification du client ${client.clientNumber}`,
      },
    });

    return updated;
  }

  async addGroupMember(
    groupId: string,
    addMemberDto: AddGroupMemberDto,
    userId: string,
  ) {
    const group = await this.findOne(groupId);
    if (group.type !== ClientType.GROUP) {
      throw new BadRequestException('Le client n\'est pas un groupe');
    }

    const member = await this.findOne(addMemberDto.memberId);
    if (member.type !== ClientType.INDIVIDUAL) {
      throw new BadRequestException('Le membre doit être une personne physique');
    }

    const groupMember = await this.prisma.groupMember.create({
      data: {
        groupId,
        memberId: addMemberDto.memberId,
        role: addMemberDto.role || 'MEMBER',
      },
      include: {
        member: true,
        group: true,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: group.organizationId,
        action: 'CREATE',
        entityType: 'GROUP_MEMBER',
        entityId: groupMember.id,
        description: `Ajout du membre ${member.clientNumber} au groupe ${group.clientNumber}`,
      },
    });

    return groupMember;
  }

  async closeClient(id: string, userId: string) {
    const client = await this.findOne(id);

    // Vérifier qu'il n'y a pas de prêts actifs
    const activeLoans = await this.prisma.loan.count({
      where: {
        clientId: id,
        status: {
          in: ['APPROVED', 'DISBURSED', 'ACTIVE'],
        },
      },
    });

    if (activeLoans > 0) {
      throw new BadRequestException(
        'Impossible de clôturer un client avec des prêts actifs',
      );
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        status: ClientStatus.CLOSED,
        closedAt: new Date(),
        closedBy: userId,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: client.organizationId,
        action: 'UPDATE',
        entityType: 'CLIENT',
        entityId: id,
        description: `Clôture du client ${client.clientNumber}`,
      },
    });

    return updated;
  }
}
