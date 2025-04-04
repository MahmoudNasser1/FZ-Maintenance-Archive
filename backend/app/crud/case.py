from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.models.case import Case, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate


class CRUDCase:
    def get(self, db: Session, case_id: UUID) -> Optional[Case]:
        """
        Get a case by ID
        """
        return db.query(Case).filter(Case.id == case_id).first()

    def get_by_serial_number(self, db: Session, serial_number: str) -> Optional[Case]:
        """
        Get a case by serial number
        """
        return db.query(Case).filter(Case.serial_number == serial_number).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        technician_id: Optional[UUID] = None,
        status: Optional[CaseStatus] = None,
        search: Optional[str] = None,
        sort_field: str = "created_at",
        sort_order: str = "desc"
    ) -> List[Case]:
        """
        Get multiple cases with filtering, searching, and pagination
        """
        query = db.query(Case)
        
        # Apply filters
        if technician_id:
            query = query.filter(Case.technician_id == technician_id)
        
        if status:
            query = query.filter(Case.status == status)
        
        # Apply search
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Case.device_model.ilike(search_term),
                    Case.serial_number.ilike(search_term),
                    Case.client_name.ilike(search_term),
                    Case.client_phone.ilike(search_term),
                    Case.issue_description.ilike(search_term)
                )
            )
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(Case, sort_field)))
        else:
            query = query.order_by(getattr(Case, sort_field))
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def get_count(
        self, 
        db: Session, 
        *, 
        technician_id: Optional[UUID] = None,
        status: Optional[CaseStatus] = None,
        search: Optional[str] = None
    ) -> int:
        """
        Get count of cases with filters
        """
        query = db.query(Case)
        
        # Apply filters
        if technician_id:
            query = query.filter(Case.technician_id == technician_id)
        
        if status:
            query = query.filter(Case.status == status)
        
        # Apply search
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Case.device_model.ilike(search_term),
                    Case.serial_number.ilike(search_term),
                    Case.client_name.ilike(search_term),
                    Case.client_phone.ilike(search_term),
                    Case.issue_description.ilike(search_term)
                )
            )
        
        return query.count()
    
    def get_by_status(self, db: Session, status: CaseStatus) -> List[Case]:
        """
        Get cases by status
        """
        return db.query(Case).filter(Case.status == status).all()
    
    def get_by_technician(self, db: Session, technician_id: UUID) -> List[Case]:
        """
        Get cases assigned to a technician
        """
        return db.query(Case).filter(Case.technician_id == technician_id).all()
    
    def create(self, db: Session, *, obj_in: CaseCreate) -> Case:
        """
        Create a new case
        """
        db_obj = Case(
            device_model=obj_in.device_model,
            serial_number=obj_in.serial_number,
            client_name=obj_in.client_name,
            client_phone=obj_in.client_phone,
            issue_description=obj_in.issue_description,
            diagnosis=obj_in.diagnosis,
            solution=obj_in.solution,
            status=obj_in.status,
            technician_id=obj_in.technician_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: Case, obj_in: Union[CaseUpdate, Dict[str, Any]]
    ) -> Case:
        """
        Update a case
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, case_id: UUID) -> Case:
        """
        Delete a case
        """
        obj = db.query(Case).get(case_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_status_counts(self, db: Session, technician_id: Optional[UUID] = None) -> Dict[str, int]:
        """
        Get counts of cases by status
        """
        query = db.query(Case.status, db.func.count(Case.id))
        
        if technician_id:
            query = query.filter(Case.technician_id == technician_id)
        
        result = query.group_by(Case.status).all()
        
        # Initialize with all statuses set to 0
        counts = {status.value: 0 for status in CaseStatus}
        
        # Update with actual counts
        for status, count in result:
            counts[status.value] = count
        
        return counts


case = CRUDCase()
