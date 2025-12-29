import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ChangeClientStatusDto,
  AddGroupMemberDto,
  FamilyMemberDto,
} from './dto/client.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { ClientStatus, ClientType, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un numéro de compte client unique
   */
  private async generateAccountNumber(): Promise<string> {
    const sequence = await this.prisma.numberSequence.upsert({
      where: { entityType: 'CLIENT' },
      update: { nextValue: { increment: 1 } },
      create: {
        entityType: 'CLIENT',
        prefix: 'CL',
        nextValue: 2,
        padLength: 8,
      },
    });

    const paddedNumber = (sequence.nextValue - 1).toString().padStart(sequence.padLength, '0');
    return `${sequence.prefix}${paddedNumber}`;
  }

  /**
   * Crée un nouveau client
   */
  async create(createClientDto: CreateClientDto, createdById: string) {
    const accountNumber = await this.generateAccountNumber();

    // Vérifier que l'agence existe
    const branch = await this.prisma.branch.findUnique({
      where: { id: createClientDto.branchId },
    });

    if (!branch) {
      throw new BadRequestException('Agence non trouvée');
    }

    // Convertir les dates si fournies
    const data: any = {
      ...createClientDto,
      accountNumber,
      status: ClientStatus.PENDING,
      createdById,
      submittedOn: new Date(),
    };

    if (createClientDto.dateOfBirth) {
      data.dateOfBirth = new Date(createClientDto.dateOfBirth);
    }
    if (createClientDto.dateOfIncorporation) {
      data.dateOfIncorporation = new Date(createClientDto.dateOfIncorporation);
    }
    if (createClientDto.idExpiryDate) {
      data.idExpiryDate = new Date(createClientDto.idExpiryDate);
    }
    if (createClientDto.idIssuedDate) {
      data.idIssuedDate = new Date(createClientDto.idIssuedDate);
    }

    const client = await this.prisma.client.create({
      data,
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatClientResponse(client);
  }

  /**
   * Récupère tous les clients avec pagination et filtres
   */
  async findAll(query: ClientQueryDto) {
    const { search, clientType, status, branchId, sortBy, sortOrder } = query;

    const where: Prisma.ClientWhereInput = {};

    if (clientType) {
      where.clientType = clientType;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          branch: true,
          _count: {
            select: {
              loans: true,
              savingsAccounts: true,
            },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    const formattedClients = clients.map((client) => this.formatClientResponse(client));
    return createPaginatedResponse(formattedClients, total, query.page || 1, query.limit || 20);
  }

  /**
   * Récupère un client par son ID
   */
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: true,
        familyMembers: true,
        loans: {
          select: {
            id: true,
            accountNumber: true,
            status: true,
            principalAmount: true,
            totalOutstanding: true,
            loanProduct: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        savingsAccounts: {
          select: {
            id: true,
            accountNumber: true,
            status: true,
            accountBalance: true,
            savingsProduct: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        groupMemberships: {
          include: {
            group: {
              select: {
                id: true,
                accountNumber: true,
                businessName: true,
              },
            },
          },
        },
        groupMembers: {
          include: {
            client: {
              select: {
                id: true,
                accountNumber: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    return this.formatClientDetailResponse(client);
  }

  /**
   * Recherche un client par numéro de compte
   */
  async findByAccountNumber(accountNumber: string) {
    const client = await this.prisma.client.findUnique({
      where: { accountNumber },
      include: {
        branch: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    return this.formatClientResponse(client);
  }

  /**
   * Met à jour un client
   */
  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    // Convertir les dates si fournies
    const data: any = { ...updateClientDto };

    if (updateClientDto.dateOfBirth) {
      data.dateOfBirth = new Date(updateClientDto.dateOfBirth);
    }
    if (updateClientDto.dateOfIncorporation) {
      data.dateOfIncorporation = new Date(updateClientDto.dateOfIncorporation);
    }
    if (updateClientDto.idExpiryDate) {
      data.idExpiryDate = new Date(updateClientDto.idExpiryDate);
    }
    if (updateClientDto.idIssuedDate) {
      data.idIssuedDate = new Date(updateClientDto.idIssuedDate);
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data,
      include: {
        branch: true,
      },
    });

    return this.formatClientResponse(updatedClient);
  }

  /**
   * Change le statut d'un client
   */
  async changeStatus(id: string, changeStatusDto: ChangeClientStatusDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    // Valider les transitions de statut
    this.validateStatusTransition(client.status, changeStatusDto.status);

    const updateData: any = {
      status: changeStatusDto.status,
    };

    if (changeStatusDto.status === ClientStatus.ACTIVE) {
      updateData.activatedOn = new Date();
    } else if (changeStatusDto.status === ClientStatus.CLOSED) {
      updateData.closedOn = new Date();
    }

    // Log l'audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CLIENT_STATUS_CHANGE',
        entityType: 'Client',
        entityId: id,
        oldValues: { status: client.status },
        newValues: { status: changeStatusDto.status, reason: changeStatusDto.reason },
      },
    });

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
      },
    });

    return this.formatClientResponse(updatedClient);
  }

  /**
   * Valide les transitions de statut
   */
  private validateStatusTransition(currentStatus: ClientStatus, newStatus: ClientStatus) {
    const validTransitions: Record<ClientStatus, ClientStatus[]> = {
      [ClientStatus.PENDING]: [ClientStatus.ACTIVE, ClientStatus.REJECTED],
      [ClientStatus.ACTIVE]: [ClientStatus.SUSPENDED, ClientStatus.CLOSED],
      [ClientStatus.SUSPENDED]: [ClientStatus.ACTIVE, ClientStatus.CLOSED],
      [ClientStatus.CLOSED]: [],
      [ClientStatus.REJECTED]: [],
      [ClientStatus.BLACKLISTED]: [ClientStatus.ACTIVE],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Transition de statut invalide: ${currentStatus} -> ${newStatus}`
      );
    }
  }

  /**
   * Ajoute un membre au groupe
   */
  async addGroupMember(groupId: string, addMemberDto: AddGroupMemberDto) {
    const group = await this.prisma.client.findUnique({
      where: { id: groupId },
    });

    if (!group || group.clientType !== ClientType.GROUP) {
      throw new BadRequestException('Le client spécifié n\'est pas un groupe');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: addMemberDto.clientId },
    });

    if (!client || client.clientType !== ClientType.INDIVIDUAL) {
      throw new BadRequestException('Seuls les individus peuvent être ajoutés à un groupe');
    }

    // Vérifier si le membre existe déjà
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_clientId: {
          groupId,
          clientId: addMemberDto.clientId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Ce membre fait déjà partie du groupe');
    }

    // Si le nouveau membre est leader, retirer le leader actuel
    if (addMemberDto.isLeader) {
      await this.prisma.groupMember.updateMany({
        where: { groupId, isLeader: true },
        data: { isLeader: false },
      });
    }

    const member = await this.prisma.groupMember.create({
      data: {
        groupId,
        clientId: addMemberDto.clientId,
        isLeader: addMemberDto.isLeader || false,
      },
      include: {
        client: {
          select: {
            id: true,
            accountNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Retire un membre du groupe
   */
  async removeGroupMember(groupId: string, clientId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_clientId: {
          groupId,
          clientId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Membre non trouvé dans ce groupe');
    }

    await this.prisma.groupMember.update({
      where: {
        groupId_clientId: {
          groupId,
          clientId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });

    return { message: 'Membre retiré du groupe' };
  }

  /**
   * Ajoute un membre de famille
   */
  async addFamilyMember(clientId: string, familyMemberDto: FamilyMemberDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    const familyMember = await this.prisma.familyMember.create({
      data: {
        clientId,
        ...familyMemberDto,
        dateOfBirth: familyMemberDto.dateOfBirth 
          ? new Date(familyMemberDto.dateOfBirth) 
          : undefined,
      },
    });

    return familyMember;
  }

  /**
   * Supprime un membre de famille
   */
  async removeFamilyMember(clientId: string, familyMemberId: string) {
    const familyMember = await this.prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        clientId,
      },
    });

    if (!familyMember) {
      throw new NotFoundException('Membre de famille non trouvé');
    }

    await this.prisma.familyMember.delete({
      where: { id: familyMemberId },
    });

    return { message: 'Membre de famille supprimé' };
  }

  /**
   * Supprime un client
   */
  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        loans: true,
        savingsAccounts: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    // Vérifier qu'il n'y a pas de prêts ou comptes actifs
    const hasActiveLoans = client.loans.some(
      (loan) => loan.status === 'ACTIVE' || loan.status === 'APPROVED'
    );
    const hasActiveSavings = client.savingsAccounts.some(
      (account) => account.status === 'ACTIVE'
    );

    if (hasActiveLoans || hasActiveSavings) {
      throw new BadRequestException(
        'Impossible de supprimer un client avec des prêts ou comptes actifs'
      );
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { message: 'Client supprimé avec succès' };
  }

  /**
   * Formate la réponse client
   */
  private formatClientResponse(client: any) {
    return {
      id: client.id,
      accountNumber: client.accountNumber,
      clientType: client.clientType,
      status: client.status,
      displayName: this.getDisplayName(client),
      firstName: client.firstName,
      lastName: client.lastName,
      businessName: client.businessName,
      phoneNumber: client.phoneNumber,
      email: client.email,
      city: client.city,
      branchId: client.branchId,
      branchName: client.branch?.name,
      loansCount: client._count?.loans || 0,
      savingsCount: client._count?.savingsAccounts || 0,
      submittedOn: client.submittedOn,
      activatedOn: client.activatedOn,
      createdAt: client.createdAt,
    };
  }

  /**
   * Formate la réponse détaillée client
   */
  private formatClientDetailResponse(client: any) {
    return {
      ...client,
      displayName: this.getDisplayName(client),
      groupMembers: client.groupMembers?.map((gm: any) => ({
        ...gm.client,
        isLeader: gm.isLeader,
        joinedAt: gm.joinedAt,
      })),
      memberOf: client.groupMemberships?.map((gm: any) => ({
        ...gm.group,
        isLeader: gm.isLeader,
        joinedAt: gm.joinedAt,
      })),
    };
  }

  /**
   * Retourne le nom d'affichage du client
   */
  private getDisplayName(client: any): string {
    if (client.clientType === ClientType.INDIVIDUAL) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return client.businessName || '';
  }
}
