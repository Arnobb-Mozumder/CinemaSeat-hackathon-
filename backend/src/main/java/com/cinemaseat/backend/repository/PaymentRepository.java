package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByHoldId(String holdId);
    Optional<Payment> findByBookingId(String bookingId);
    List<Payment> findAllByHoldId(String holdId);
}
