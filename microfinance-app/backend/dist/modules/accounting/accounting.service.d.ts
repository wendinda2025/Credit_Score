import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
export declare class AccountingService {
    private prisma;
    constructor(prisma: PrismaService);
    createAccount(dto: CreateAccountDto): Promise<{
        name: string;
        id: string;
        code: string;
        type: string;
        balance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getAccounts(): Promise<{
        name: string;
        id: string;
        code: string;
        type: string;
        balance: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    recordEntry(dto: CreateJournalEntryDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        entryDate: Date;
        debitAccountId: string;
        debitAmount: import("@prisma/client/runtime/library").Decimal;
        creditAccountId: string;
        creditAmount: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
    }>;
    getBalanceSheet(): Promise<{
        assets: {
            name: string;
            id: string;
            code: string;
            type: string;
            balance: import("@prisma/client/runtime/library").Decimal;
        }[];
        liabilities: {
            name: string;
            id: string;
            code: string;
            type: string;
            balance: import("@prisma/client/runtime/library").Decimal;
        }[];
        equity: {
            name: string;
            id: string;
            code: string;
            type: string;
            balance: import("@prisma/client/runtime/library").Decimal;
        }[];
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
    }>;
}
