package com.library.controller;

import com.library.model.Reservation;
import com.library.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    @Autowired
    private LibraryService libraryService;

    @PostMapping
    public ResponseEntity<?> reserveBook(@RequestBody Map<String, Long> payload) {
        Long memberId = payload.get("memberId");
        Long bookId = payload.get("bookId");

        if (memberId == null || bookId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Both memberId and bookId are required"));
        }

        try {
            Reservation reservation = libraryService.reserveBook(memberId, bookId);
            return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public List<Reservation> getAllReservations() {
        return libraryService.getAllReservations();
    }

    @GetMapping("/member/{memberId}")
    public List<Reservation> getMemberReservations(@PathVariable Long memberId) {
        return libraryService.getMemberReservations(memberId);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReservationStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required"));
        }

        try {
            Reservation reservation = libraryService.updateReservationStatus(id, status);
            return ResponseEntity.ok(reservation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
