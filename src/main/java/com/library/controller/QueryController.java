package com.library.controller;

import com.library.model.QueryMessage;
import com.library.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/queries")
@CrossOrigin(origins = "*")
@Validated
public class QueryController {

    @Autowired
    private LibraryService libraryService;

    @PostMapping
    public ResponseEntity<QueryMessage> submitQuery(@Valid @RequestBody QueryMessage queryMessage) {
        QueryMessage savedQuery = libraryService.saveQuery(queryMessage);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuery);
    }

    @GetMapping
    public List<QueryMessage> getAllQueries() {
        return libraryService.getAllQueries();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuery(@PathVariable Long id) {
        try {
            libraryService.deleteQuery(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
