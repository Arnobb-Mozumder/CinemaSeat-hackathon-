package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.Hold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoldRepository extends JpaRepository<Hold, String> {
}
