import { InterestType, Periodicity } from '@prisma/client';
export declare class CreateLoanProductDto {
    name: string;
    description?: string;
    minAmount: number;
    maxAmount?: number;
    minInterest: number;
    maxInterest?: number;
    interestType: InterestType;
    periodicity: Periodicity;
}
export declare class CreateLoanApplicationDto {
    clientId: string;
    productId: string;
    amount: number;
    interestRate: number;
    duration: number;
}
export declare class RepayLoanDto {
    amount: number;
}
