from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from typing import List, Dict, Optional, Any, Union
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps.auth import get_current_active_user, get_current_manager_or_admin_user
from app.models.user import User
from app.models.case import Case, CaseStatus, CasePriority
from app.models.activity import Activity
from app.crud.case import case

router = APIRouter()


class TimeRange(BaseModel):
    """Schema for time range selection"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_unit: str = "day"  # day, week, month


class StatusDistribution(BaseModel):
    """Schema for status distribution"""
    status: str
    count: int
    percentage: float


class TimeSeriesPoint(BaseModel):
    """Schema for time series data point"""
    date: str
    new_cases: int
    resolved_cases: int
    active_cases: int


class TechnicianPerformance(BaseModel):
    """Schema for technician performance"""
    technician_id: UUID
    technician_name: str
    assigned_cases: int
    resolved_cases: int
    avg_resolution_time: Optional[float] = None  # في الساعات
    performance_score: Optional[float] = None


class DeviceTypeDistribution(BaseModel):
    """Schema for device type distribution"""
    device_type: str
    count: int
    percentage: float


class ResolutionTimeStats(BaseModel):
    """Schema for resolution time statistics"""
    avg_resolution_time: float  # بالساعات
    min_resolution_time: float
    max_resolution_time: float
    resolution_time_distribution: Dict[str, int]  # مثال: {"0-24h": 25, "24-48h": 15, ...}


class RevenueStats(BaseModel):
    """Schema for revenue statistics"""
    total_revenue: float
    avg_revenue_per_case: float
    revenue_by_status: Dict[str, float]
    revenue_by_device_type: Dict[str, float]
    monthly_revenue: Dict[str, float]


class CustomerSatisfactionStats(BaseModel):
    """Schema for customer satisfaction statistics"""
    avg_rating: float
    rating_distribution: Dict[str, int]  # مثال: {"1": 5, "2": 10, ...}
    satisfaction_by_technician: Dict[str, float]
    satisfaction_trend: Dict[str, float]


@router.get("/status-distribution", response_model=List[StatusDistribution])
async def get_status_distribution(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على توزيع الحالات حسب الحالة
    
    يوفر أعداد ونسب الحالات لكل حالة ضمن نطاق زمني محدد
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    query = db.query(Case.status, func.count(Case.id).label("count"))
    
    if time_range.start_date:
        query = query.filter(Case.created_at >= time_range.start_date)
    if time_range.end_date:
        query = query.filter(Case.created_at <= time_range.end_date)
        
    result = query.group_by(Case.status).all()
    
    # حساب المجموع الكلي للحالات
    total_cases = sum(count for _, count in result)
    
    # إنشاء التوزيع مع النسب المئوية
    distribution = []
    for status, count in result:
        percentage = (count / total_cases) * 100 if total_cases > 0 else 0
        distribution.append({
            "status": status.value,
            "count": count,
            "percentage": round(percentage, 2)
        })
    
    return distribution


@router.get("/time-series", response_model=List[TimeSeriesPoint])
async def get_time_series_data(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على بيانات السلسلة الزمنية لحالات الصيانة
    
    يوفر أعداد الحالات الجديدة والمحلولة والنشطة خلال فترة زمنية
    
    المعلمات:
    - time_range: نطاق زمني للتصفية والوحدة الزمنية (يوم، أسبوع، شهر)
    """
    # تحديد النطاق الزمني الافتراضي (30 يومًا)
    end_date = time_range.end_date or datetime.now()
    start_date = time_range.start_date or (end_date - timedelta(days=30))
    
    # تحديد وحدة التجميع
    if time_range.time_unit == "day":
        date_trunc = func.date(Case.created_at)
    elif time_range.time_unit == "week":
        date_trunc = func.date_trunc('week', Case.created_at)
    else:  # month
        date_trunc = func.date_trunc('month', Case.created_at)
    
    # الحصول على البيانات اليومية للحالات الجديدة
    new_cases_query = db.query(
        date_trunc.label('date'),
        func.count(Case.id).label('count')
    ).filter(
        Case.created_at.between(start_date, end_date)
    ).group_by('date').order_by('date')
    
    new_cases_data = {row.date.isoformat(): row.count for row in new_cases_query.all()}
    
    # الحصول على البيانات اليومية للحالات المحلولة
    resolved_cases_query = db.query(
        date_trunc.label('date'),
        func.count(Case.id).label('count')
    ).filter(
        Case.updated_at.between(start_date, end_date),
        Case.status == CaseStatus.resolved
    ).group_by('date').order_by('date')
    
    resolved_cases_data = {row.date.isoformat(): row.count for row in resolved_cases_query.all()}
    
    # حساب عدد الحالات النشطة عند كل نقطة زمنية
    all_dates = sorted(set(list(new_cases_data.keys()) + list(resolved_cases_data.keys())))
    active_cases = 0  # بدء العد من الصفر
    
    # الحصول على عدد الحالات النشطة في بداية الفترة
    active_cases_start = db.query(func.count(Case.id)).filter(
        Case.created_at < start_date,
        Case.status.in_([CaseStatus.new, CaseStatus.assigned, CaseStatus.in_progress])
    ).scalar()
    
    if active_cases_start:
        active_cases = active_cases_start
    
    time_series = []
    
    for date_str in all_dates:
        # حساب الحالات الجديدة والمحلولة في هذا اليوم
        new_in_day = new_cases_data.get(date_str, 0)
        resolved_in_day = resolved_cases_data.get(date_str, 0)
        
        # تحديث عدد الحالات النشطة
        active_cases = active_cases + new_in_day - resolved_in_day
        
        # إضافة النقطة إلى السلسلة الزمنية
        time_series.append({
            "date": date_str,
            "new_cases": new_in_day,
            "resolved_cases": resolved_in_day,
            "active_cases": active_cases
        })
    
    return time_series


@router.get("/technician-performance", response_model=List[TechnicianPerformance])
async def get_technician_performance(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    الحصول على أداء الفنيين
    
    يوفر إحصائيات حول أداء كل فني، بما في ذلك عدد الحالات المعينة والمحلولة ومتوسط وقت الحل
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    # تحديد النطاق الزمني الافتراضي (30 يومًا)
    end_date = time_range.end_date or datetime.now()
    start_date = time_range.start_date or (end_date - timedelta(days=30))
    
    # الحصول على الفنيين وأدائهم
    technicians = db.query(User).filter(User.role == "technician").all()
    
    performance_data = []
    
    for tech in technicians:
        # عدد الحالات المعينة للفني
        assigned_count = db.query(func.count(Case.id)).filter(
            Case.technician_id == tech.id,
            Case.created_at.between(start_date, end_date)
        ).scalar()
        
        # عدد الحالات التي تم حلها بواسطة الفني
        resolved_count = db.query(func.count(Case.id)).filter(
            Case.technician_id == tech.id,
            Case.status == CaseStatus.resolved,
            Case.updated_at.between(start_date, end_date)
        ).scalar()
        
        # حساب متوسط وقت الحل (بالساعات)
        avg_resolution_time = None
        resolved_cases = db.query(Case).filter(
            Case.technician_id == tech.id,
            Case.status == CaseStatus.resolved,
            Case.updated_at.between(start_date, end_date)
        ).all()
        
        if resolved_cases:
            total_hours = 0
            count = 0
            
            for case_item in resolved_cases:
                if case_item.created_at and case_item.updated_at:
                    # حساب الوقت بالساعات
                    delta = case_item.updated_at - case_item.created_at
                    hours = delta.total_seconds() / 3600
                    total_hours += hours
                    count += 1
            
            if count > 0:
                avg_resolution_time = round(total_hours / count, 2)
        
        # حساب درجة الأداء البسيطة (قابل للتخصيص)
        performance_score = None
        if resolved_count is not None and assigned_count is not None and assigned_count > 0:
            performance_score = round((resolved_count / assigned_count) * 100, 2)
            
            # تعديل الدرجة بناءً على وقت الحل (إذا كان متاحًا)
            if avg_resolution_time is not None:
                # تأثير سلبي إذا كان الوقت أطول من 48 ساعة
                if avg_resolution_time > 48:
                    performance_score = performance_score * 0.9
                # تأثير إيجابي إذا كان الوقت أقل من 24 ساعة
                elif avg_resolution_time < 24:
                    performance_score = min(performance_score * 1.1, 100)
        
        performance_data.append({
            "technician_id": tech.id,
            "technician_name": tech.full_name,
            "assigned_cases": assigned_count or 0,
            "resolved_cases": resolved_count or 0,
            "avg_resolution_time": avg_resolution_time,
            "performance_score": performance_score
        })
    
    # ترتيب البيانات حسب درجة الأداء (تنازليًا)
    performance_data.sort(key=lambda x: x.get("performance_score", 0) or 0, reverse=True)
    
    return performance_data


@router.get("/device-distribution", response_model=List[DeviceTypeDistribution])
async def get_device_distribution(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على توزيع الأجهزة حسب النوع
    
    يوفر إحصائيات حول أنواع الأجهزة التي تمت صيانتها
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    query = db.query(
        Case.device_model,
        func.count(Case.id).label("count")
    )
    
    if time_range.start_date:
        query = query.filter(Case.created_at >= time_range.start_date)
    if time_range.end_date:
        query = query.filter(Case.created_at <= time_range.end_date)
    
    result = query.group_by(Case.device_model).order_by(desc("count")).all()
    
    # حساب المجموع الكلي
    total_devices = sum(count for _, count in result)
    
    # إنشاء التوزيع مع النسب المئوية
    distribution = []
    for device_model, count in result:
        percentage = (count / total_devices) * 100 if total_devices > 0 else 0
        distribution.append({
            "device_type": device_model or "غير محدد",
            "count": count,
            "percentage": round(percentage, 2)
        })
    
    return distribution


@router.get("/resolution-time", response_model=ResolutionTimeStats)
async def get_resolution_time_stats(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على إحصائيات وقت حل الحالات
    
    يوفر معلومات عن متوسط وأقصى وأدنى وقت لحل الحالات وتوزيع أوقات الحل
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    # تحديد النطاق الزمني الافتراضي (30 يومًا)
    end_date = time_range.end_date or datetime.now()
    start_date = time_range.start_date or (end_date - timedelta(days=30))
    
    # الحصول على الحالات المحلولة في النطاق الزمني المحدد
    resolved_cases = db.query(Case).filter(
        Case.status == CaseStatus.resolved,
        Case.created_at >= start_date,
        Case.updated_at <= end_date,
        Case.updated_at > Case.created_at  # تأكد من أن الحالة تم تحديثها بعد إنشائها
    ).all()
    
    if not resolved_cases:
        return {
            "avg_resolution_time": 0,
            "min_resolution_time": 0,
            "max_resolution_time": 0,
            "resolution_time_distribution": {}
        }
    
    # حساب أوقات الحل بالساعات
    resolution_times = []
    for case_item in resolved_cases:
        if case_item.created_at and case_item.updated_at:
            delta = case_item.updated_at - case_item.created_at
            hours = delta.total_seconds() / 3600
            resolution_times.append(hours)
    
    if not resolution_times:
        return {
            "avg_resolution_time": 0,
            "min_resolution_time": 0,
            "max_resolution_time": 0,
            "resolution_time_distribution": {}
        }
    
    # حساب الإحصائيات الأساسية
    avg_time = sum(resolution_times) / len(resolution_times)
    min_time = min(resolution_times)
    max_time = max(resolution_times)
    
    # إنشاء توزيع أوقات الحل
    time_ranges = {
        "0-24h": 0,
        "24-48h": 0,
        "48-72h": 0,
        "72-96h": 0,
        "96h+": 0
    }
    
    for hours in resolution_times:
        if hours <= 24:
            time_ranges["0-24h"] += 1
        elif hours <= 48:
            time_ranges["24-48h"] += 1
        elif hours <= 72:
            time_ranges["48-72h"] += 1
        elif hours <= 96:
            time_ranges["72-96h"] += 1
        else:
            time_ranges["96h+"] += 1
    
    return {
        "avg_resolution_time": round(avg_time, 2),
        "min_resolution_time": round(min_time, 2),
        "max_resolution_time": round(max_time, 2),
        "resolution_time_distribution": time_ranges
    }


@router.get("/revenue", response_model=RevenueStats)
async def get_revenue_stats(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    الحصول على إحصائيات الإيرادات
    
    يوفر معلومات عن إجمالي الإيرادات وتوزيعها حسب الحالة ونوع الجهاز والشهر
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    # تحديد النطاق الزمني الافتراضي (365 يومًا)
    end_date = time_range.end_date or datetime.now()
    start_date = time_range.start_date or (end_date - timedelta(days=365))
    
    # الحصول على الحالات التي تم حلها أو إنشاؤها في النطاق الزمني المحدد
    cases = db.query(Case).filter(
        Case.created_at >= start_date,
        Case.created_at <= end_date
    ).all()
    
    if not cases:
        return {
            "total_revenue": 0,
            "avg_revenue_per_case": 0,
            "revenue_by_status": {},
            "revenue_by_device_type": {},
            "monthly_revenue": {}
        }
    
    # حساب إجمالي الإيرادات
    total_revenue = sum(case_item.cost or 0 for case_item in cases)
    avg_revenue = total_revenue / len(cases) if cases else 0
    
    # حساب الإيرادات حسب الحالة
    revenue_by_status = {}
    for case_item in cases:
        status = case_item.status.value
        cost = case_item.cost or 0
        if status in revenue_by_status:
            revenue_by_status[status] += cost
        else:
            revenue_by_status[status] = cost
    
    # حساب الإيرادات حسب نوع الجهاز
    revenue_by_device = {}
    for case_item in cases:
        device_type = case_item.device_model or "غير محدد"
        cost = case_item.cost or 0
        if device_type in revenue_by_device:
            revenue_by_device[device_type] += cost
        else:
            revenue_by_device[device_type] = cost
    
    # حساب الإيرادات الشهرية
    monthly_revenue = {}
    for case_item in cases:
        if case_item.created_at:
            month_key = case_item.created_at.strftime("%Y-%m")
            cost = case_item.cost or 0
            if month_key in monthly_revenue:
                monthly_revenue[month_key] += cost
            else:
                monthly_revenue[month_key] = cost
    
    return {
        "total_revenue": round(total_revenue, 2),
        "avg_revenue_per_case": round(avg_revenue, 2),
        "revenue_by_status": {k: round(v, 2) for k, v in revenue_by_status.items()},
        "revenue_by_device_type": {k: round(v, 2) for k, v in revenue_by_device.items()},
        "monthly_revenue": {k: round(v, 2) for k, v in monthly_revenue.items()}
    }


@router.get("/customer-satisfaction", response_model=CustomerSatisfactionStats)
async def get_customer_satisfaction_stats(
    time_range: TimeRange = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    الحصول على إحصائيات رضا العملاء
    
    يوفر معلومات عن متوسط تقييم العملاء وتوزيع التقييمات ورضا العملاء حسب الفني
    
    المعلمات:
    - time_range: نطاق زمني للتصفية (اختياري)
    """
    # تحديد النطاق الزمني الافتراضي (365 يومًا)
    end_date = time_range.end_date or datetime.now()
    start_date = time_range.start_date or (end_date - timedelta(days=365))
    
    # الحصول على الحالات التي تم حلها في النطاق الزمني المحدد وتحتوي على تقييم
    cases = db.query(Case).filter(
        Case.status == CaseStatus.resolved,
        Case.updated_at >= start_date,
        Case.updated_at <= end_date,
        Case.customer_satisfaction.isnot(None)
    ).all()
    
    # إذا لم تكن هناك حالات بتقييمات، عد ببيانات فارغة
    if not cases:
        return {
            "avg_rating": 0,
            "rating_distribution": {},
            "satisfaction_by_technician": {},
            "satisfaction_trend": {}
        }
    
    # حساب متوسط التقييم
    ratings = [case_item.customer_satisfaction for case_item in cases if case_item.customer_satisfaction is not None]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # حساب توزيع التقييمات
    rating_distribution = {str(i): 0 for i in range(1, 6)}  # تقييمات من 1 إلى 5
    for rating in ratings:
        if 1 <= rating <= 5:
            rating_distribution[str(rating)] += 1
    
    # حساب رضا العملاء حسب الفني
    tech_ratings = {}
    tech_counts = {}
    
    for case_item in cases:
        if case_item.technician_id and case_item.customer_satisfaction:
            tech_id = str(case_item.technician_id)
            if tech_id in tech_ratings:
                tech_ratings[tech_id] += case_item.customer_satisfaction
                tech_counts[tech_id] += 1
            else:
                tech_ratings[tech_id] = case_item.customer_satisfaction
                tech_counts[tech_id] = 1
    
    satisfaction_by_technician = {}
    for tech_id, total in tech_ratings.items():
        if tech_counts[tech_id] > 0:
            # الحصول على اسم الفني
            technician = db.query(User).filter(User.id == UUID(tech_id)).first()
            tech_name = technician.full_name if technician else tech_id
            satisfaction_by_technician[tech_name] = round(total / tech_counts[tech_id], 2)
    
    # حساب اتجاه رضا العملاء على مدار الوقت (شهريًا)
    satisfaction_trend = {}
    
    for case_item in cases:
        if case_item.updated_at and case_item.customer_satisfaction:
            month_key = case_item.updated_at.strftime("%Y-%m")
            if month_key in satisfaction_trend:
                satisfaction_trend[month_key]["total"] += case_item.customer_satisfaction
                satisfaction_trend[month_key]["count"] += 1
            else:
                satisfaction_trend[month_key] = {
                    "total": case_item.customer_satisfaction,
                    "count": 1
                }
    
    # حساب المتوسط الشهري
    monthly_satisfaction = {}
    for month, data in satisfaction_trend.items():
        if data["count"] > 0:
            monthly_satisfaction[month] = round(data["total"] / data["count"], 2)
    
    return {
        "avg_rating": round(avg_rating, 2),
        "rating_distribution": rating_distribution,
        "satisfaction_by_technician": satisfaction_by_technician,
        "satisfaction_trend": monthly_satisfaction
    }


@router.get("/cases-by-priority", response_model=Dict[str, int])
async def get_cases_by_priority(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على عدد الحالات حسب الأولوية
    
    يوفر توزيع الحالات حسب مستويات الأولوية
    """
    # الحصول على عدد الحالات لكل مستوى أولوية
    priority_counts = db.query(
        Case.priority,
        func.count(Case.id).label("count")
    ).group_by(Case.priority).all()
    
    # تحويل النتائج إلى قاموس
    result = {priority.value if priority else "غير محدد": count for priority, count in priority_counts}
    
    # التأكد من وجود جميع مستويات الأولوية في النتائج
    for priority in ["low", "medium", "high", "urgent"]:
        if priority not in result:
            result[priority] = 0
    
    return result
