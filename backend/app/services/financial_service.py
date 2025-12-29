"""
Service pour les calculs financiers
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.financial_analysis import FinancialAnalysis
from app.schemas.financial_analysis import FinancialAnalysisUpdate


class FinancialService:
    """Service de calculs financiers"""
    
    @staticmethod
    def calculate_totals(analysis: FinancialAnalysis) -> None:
        """Calcule tous les totaux et ratios"""
        # Total budget familial
        analysis.family_total = (
            analysis.family_food + analysis.family_rent + analysis.family_education +
            analysis.family_clothing + analysis.family_transport + analysis.family_water +
            analysis.family_electricity + analysis.family_phone + analysis.family_medical +
            analysis.family_other
        )
        
        # Total des ventes
        analysis.total_monthly_sales = (
            analysis.monthly_sales_activity_a + 
            analysis.monthly_sales_activity_b + 
            analysis.monthly_sales_activity_c
        )
        
        # Total coût des marchandises vendues
        analysis.total_monthly_cogs = (
            analysis.monthly_cogs_activity_a + 
            analysis.monthly_cogs_activity_b + 
            analysis.monthly_cogs_activity_c
        )
        
        # Marge brute
        analysis.gross_margin = analysis.total_monthly_sales - analysis.total_monthly_cogs
        
        # Pourcentage de marge brute
        if analysis.total_monthly_sales > 0:
            analysis.gross_margin_percentage = analysis.gross_margin / analysis.total_monthly_sales
        else:
            analysis.gross_margin_percentage = 0.0
        
        # Total des charges opérationnelles
        analysis.total_operating_expenses = (
            analysis.salaries + analysis.rent + analysis.utilities +
            analysis.transport_communication + analysis.maintenance + analysis.customs_fees +
            analysis.taxes + analysis.interest_paid + analysis.bank_charges +
            analysis.loan_repayments + analysis.depreciation + analysis.other_expenses
        )
        
        # Résultat net mensuel
        analysis.net_profit = analysis.gross_margin - analysis.total_operating_expenses
        
        # Cash flow mensuel (résultat net + dépréciations - budget familial)
        analysis.monthly_cash_flow = (
            analysis.net_profit + analysis.depreciation - analysis.family_total + analysis.other_income
        )
        
        # Capacité d'autofinancement annuelle
        analysis.annual_cash_available = analysis.monthly_cash_flow * 12
        
        # Capacité de remboursement (70% de la CAF)
        analysis.debt_service_capacity = int(analysis.annual_cash_available * 0.7)
        
        # Valeur nette
        analysis.net_worth = analysis.total_assets - analysis.total_liabilities
        
        # Ratios
        if analysis.total_assets > 0:
            analysis.liquidity_ratio = analysis.net_worth / analysis.total_assets
        else:
            analysis.liquidity_ratio = 0.0
        
        if analysis.total_assets > 0:
            analysis.debt_ratio = analysis.total_liabilities / analysis.total_assets
        else:
            analysis.debt_ratio = 0.0
        
        if analysis.total_monthly_sales > 0:
            analysis.profitability_ratio = analysis.net_profit / analysis.total_monthly_sales
        else:
            analysis.profitability_ratio = 0.0
        
        if analysis.loan_repayments > 0:
            analysis.coverage_ratio = analysis.monthly_cash_flow / analysis.loan_repayments
        else:
            analysis.coverage_ratio = 0.0
    
    @staticmethod
    def get_by_application(db: Session, application_id: int) -> FinancialAnalysis:
        """Récupère l'analyse financière d'une demande"""
        analysis = db.query(FinancialAnalysis).filter(
            FinancialAnalysis.credit_application_id == application_id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analyse financière non trouvée"
            )
        
        return analysis
    
    @staticmethod
    def update(
        db: Session, 
        application_id: int, 
        analysis_data: FinancialAnalysisUpdate
    ) -> FinancialAnalysis:
        """Met à jour l'analyse financière"""
        analysis = FinancialService.get_by_application(db, application_id)
        
        # Mettre à jour les champs
        update_data = analysis_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(analysis, field, value)
        
        # Recalculer les totaux et ratios
        FinancialService.calculate_totals(analysis)
        
        db.commit()
        db.refresh(analysis)
        
        return analysis
    
    @staticmethod
    def get_recommendation(analysis: FinancialAnalysis) -> Dict[str, Any]:
        """Génère une recommandation basée sur l'analyse"""
        recommendation = {
            "can_approve": True,
            "risks": [],
            "strengths": [],
            "warnings": []
        }
        
        # Évaluer la marge brute
        if analysis.gross_margin_percentage < 0.15:
            recommendation["risks"].append("Marge brute faible (< 15%)")
            recommendation["can_approve"] = False
        elif analysis.gross_margin_percentage > 0.25:
            recommendation["strengths"].append(f"Bonne marge brute ({analysis.gross_margin_percentage:.1%})")
        
        # Évaluer le cash flow
        if analysis.monthly_cash_flow < 0:
            recommendation["risks"].append("Cash flow mensuel négatif")
            recommendation["can_approve"] = False
        elif analysis.monthly_cash_flow > 100000:
            recommendation["strengths"].append("Cash flow mensuel positif et solide")
        
        # Évaluer le ratio d'endettement
        if analysis.debt_ratio > 0.7:
            recommendation["risks"].append("Ratio d'endettement élevé (> 70%)")
        elif analysis.debt_ratio < 0.5:
            recommendation["strengths"].append("Ratio d'endettement sain")
        
        # Évaluer la rentabilité
        if analysis.profitability_ratio < 0:
            recommendation["risks"].append("Activité non rentable")
            recommendation["can_approve"] = False
        elif analysis.profitability_ratio > 0.1:
            recommendation["strengths"].append("Bonne rentabilité")
        
        # Évaluer le ratio de couverture
        if analysis.coverage_ratio < 1.0 and analysis.loan_repayments > 0:
            recommendation["warnings"].append("Capacité de remboursement limite")
        elif analysis.coverage_ratio > 1.5:
            recommendation["strengths"].append("Excellente capacité de remboursement")
        
        return recommendation
