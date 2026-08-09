package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentEventRepository extends JpaRepository<PaymentEvent, String> {
}
