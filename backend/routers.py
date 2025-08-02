from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
from services import FAQService, TariffsService, application_service
from models import (
    FAQResponse, FAQItem, FAQCategories, FAQData, TariffsResponse, Tariff, TariffDiscounts,
    FAQCreate, FAQUpdate, FAQStats, ApplicationCreate, ApplicationResponse
)

# Create router instances
faq_router = APIRouter()
tariffs_router = APIRouter()

# Initialize services
faq_service = FAQService()
tariffs_service = TariffsService()

# FAQ Routes
@faq_router.get("/", response_model=FAQResponse)
async def get_all_faq():
    """Get all FAQ data"""
    try:
        data = faq_service.get_all_faq()
        return FAQResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/categories", response_model=FAQCategories)
async def get_categories():
    """Get FAQ categories"""
    try:
        return faq_service.get_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/category/{category}", response_model=List[FAQItem])
async def get_faq_by_category(category: str):
    """Get FAQ items by category"""
    try:
        items = faq_service.get_faq_by_category(category)
        if not items:
            raise HTTPException(status_code=404, detail=f"No FAQ items found for category: {category}")
        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/search", response_model=FAQResponse)
async def search_faq(q: str = Query(..., description="Search query")):
    """Search FAQ by keywords or text"""
    try:
        if not q.strip():
            raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
        results = faq_service.search_faq(q)
        categories = faq_service.get_categories()
        return FAQResponse(success=True, data=FAQData(faq=results, categories=categories))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/{faq_id}", response_model=FAQItem)
async def get_faq_by_id(faq_id: int):
    """Get FAQ item by ID"""
    try:
        item = faq_service.get_faq_by_id(faq_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"FAQ item with ID {faq_id} not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/popular", response_model=List[FAQItem])
async def get_popular_questions(limit: int = Query(5, description="Number of questions to return")):
    """Get popular questions by priority"""
    try:
        return faq_service.get_popular_questions(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/recent", response_model=List[FAQItem])
async def get_recent_questions(limit: int = Query(5, description="Number of questions to return")):
    """Get recent questions by creation date"""
    try:
        return faq_service.get_recent_questions(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/keyword/{keyword}", response_model=List[FAQItem])
async def get_questions_by_keyword(keyword: str):
    """Get questions containing specific keyword"""
    try:
        results = faq_service.get_questions_by_keyword(keyword)
        if not results:
            raise HTTPException(status_code=404, detail=f"No questions found for keyword: {keyword}")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.get("/stats", response_model=Dict)
async def get_faq_stats():
    """Get FAQ statistics"""
    try:
        return faq_service.get_faq_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin FAQ Routes (for managing FAQ content)
@faq_router.post("/admin/add", response_model=FAQItem)
async def add_faq_item(faq_item: FAQCreate):
    """Add new FAQ item (admin only)"""
    try:
        # Here you would typically check admin permissions
        new_item = faq_service.add_faq_item(faq_item)
        return new_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.put("/admin/{faq_id}", response_model=FAQItem)
async def update_faq_item(faq_id: int, update_data: FAQUpdate):
    """Update FAQ item (admin only)"""
    try:
        # Here you would typically check admin permissions
        updated_item = faq_service.update_faq_item(faq_id, update_data)
        if not updated_item:
            raise HTTPException(status_code=404, detail=f"FAQ item with ID {faq_id} not found")
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@faq_router.delete("/admin/{faq_id}")
async def delete_faq_item(faq_id: int):
    """Delete FAQ item (admin only)"""
    try:
        # Here you would typically check admin permissions
        success = faq_service.delete_faq_item(faq_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"FAQ item with ID {faq_id} not found")
        return {"message": f"FAQ item {faq_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Tariffs Routes
@tariffs_router.get("/", response_model=TariffsResponse)
async def get_all_tariffs():
    """Get all tariffs data"""
    try:
        data = tariffs_service.get_all_tariffs()
        return TariffsResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/tariff/{tariff_id}", response_model=Tariff)
async def get_tariff_by_id(tariff_id: str):
    """Get tariff by ID"""
    try:
        tariff = tariffs_service.get_tariff_by_id(tariff_id)
        if not tariff:
            raise HTTPException(status_code=404, detail=f"Tariff with ID {tariff_id} not found")
        return tariff
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/popular", response_model=List[Tariff])
async def get_popular_tariffs():
    """Get popular tariffs"""
    try:
        return tariffs_service.get_popular_tariffs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/recommended", response_model=List[Tariff])
async def get_recommended_tariffs():
    """Get recommended tariffs"""
    try:
        return tariffs_service.get_recommended_tariffs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/discounts", response_model=TariffDiscounts)
async def get_discounts():
    """Get discount information"""
    try:
        return tariffs_service.get_discounts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/trial-period")
async def get_trial_period():
    """Get trial period days"""
    try:
        days = tariffs_service.get_trial_period()
        return {"trial_period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tariffs_router.get("/calculate-price/{tariff_id}")
async def calculate_price_with_discount(
    tariff_id: str, 
    period: str = Query(..., description="Period: monthly, quarterly, or yearly")
):
    """Calculate price with discount for different periods"""
    try:
        if period not in ["monthly", "quarterly", "yearly"]:
            raise HTTPException(status_code=400, detail="Period must be monthly, quarterly, or yearly")
        
        result = tariffs_service.calculate_price_with_discount(tariff_id, period)
        if not result:
            raise HTTPException(status_code=404, detail=f"Tariff with ID {tariff_id} not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 

# Application Router
applications_router = APIRouter()

@applications_router.post("/submit", response_model=ApplicationResponse)
async def submit_application(application: ApplicationCreate):
    """Отправка заявки"""
    try:
        result = await application_service.submit_application(application.dict())
        return ApplicationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 