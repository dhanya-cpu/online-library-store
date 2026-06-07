package com.library.controller;

import com.library.model.Transaction;
import com.library.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private LibraryService libraryService;

    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@RequestBody Map<String, Long> payload) {
        Long memberId = payload.get("memberId");
        Long bookId = payload.get("bookId");

        if (memberId == null || bookId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Both memberId and bookId are required"));
        }

        try {
            Transaction transaction = libraryService.issueBook(memberId, bookId);
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/return")
    public ResponseEntity<?> returnBook(@RequestBody Map<String, Long> payload) {
        Long memberId = payload.get("memberId");
        Long bookId = payload.get("bookId");

        if (memberId == null || bookId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Both memberId and bookId are required"));
        }

        try {
            Transaction transaction = libraryService.returnBook(memberId, bookId);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public List<Transaction> getActiveTransactions() {
        return libraryService.getActiveTransactions();
    }

    @GetMapping("/history")
    public List<Transaction> getTransactionHistory() {
        return libraryService.getTransactionHistory();
    }

    @GetMapping("/member/{memberId}")
    public List<Transaction> getMemberTransactions(@PathVariable Long memberId) {
        return libraryService.getMemberTransactions(memberId);
    }

    @PostMapping("/payfine/{transactionId}")
    public ResponseEntity<?> payFine(@PathVariable Long transactionId) {
        try {
            Transaction transaction = libraryService.payFine(transactionId);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
