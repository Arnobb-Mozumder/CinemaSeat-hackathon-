package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    Optional<Booking> findByBookingReference(String bookingReference);
    Optional<Booking> findByHoldId(String holdId);
}
