export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare class CreateAccountDto {
    code: string;
    name: string;
    type: string;
}
export declare class CreateJournalEntryDto {
    description: string;
    entryDate: string;
    debitAccountId: string;
    debitAmount: number;
    creditAccountId: string;
    creditAmount: number;
    transactionId?: string;
}
