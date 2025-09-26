export type Voucher = {
    id: string;
    code: string;
    increaseAmount: number;
    durationMonths: number;
    status: "revoked" | "active" | "used";
    validUntil: Date;
    federalStateId: string;
    redeemedBy: string | null;
    redeemedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    createReason: string;
    updatedBy: string | null;
    updatedAt: Date | null;
    updateReason: string;
};