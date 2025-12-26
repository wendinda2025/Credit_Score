"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansController = void 0;
const common_1 = require("@nestjs/common");
const loans_service_1 = require("./services/loans.service");
const loan_dto_1 = require("./dto/loan.dto");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../modules/auth/guards/roles.guard");
const roles_decorator_1 = require("../../modules/auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let LoansController = class LoansController {
    constructor(loansService) {
        this.loansService = loansService;
    }
    createProduct(dto) {
        return this.loansService.createProduct(dto);
    }
    getProducts() {
        return this.loansService.getProducts();
    }
    apply(req, dto) {
        return this.loansService.createApplication(req.user.userId, dto);
    }
    getLoan(id) {
        return this.loansService.getLoan(id);
    }
    approve(req, id) {
        return this.loansService.approveLoan(id, req.user.userId);
    }
    disburse(req, id) {
        return this.loansService.disburseLoan(id, req.user.userId);
    }
    repay(req, id, dto) {
        return this.loansService.repayLoan(id, dto, req.user.userId);
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)('products'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loan_dto_1.CreateLoanProductDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('apply'),
    (0, roles_decorator_1.Roles)(client_1.Role.LOAN_OFFICER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, loan_dto_1.CreateLoanApplicationDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getLoan", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.LOAN_OFFICER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/disburse'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "disburse", null);
__decorate([
    (0, common_1.Post)(':id/repay'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, loan_dto_1.RepayLoanDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "repay", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.Controller)('loans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [loans_service_1.LoansService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map