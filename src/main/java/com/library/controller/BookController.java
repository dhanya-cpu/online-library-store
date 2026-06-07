package com.library.controller;

import com.library.model.Book;
import com.library.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
@Validated
public class BookController {

    @Autowired
    private LibraryService libraryService;

    @GetMapping
    public List<Book> getBooks(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return libraryService.searchBooks(search);
        }
        return libraryService.getAllBooks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return libraryService.getBookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return libraryService.getCategories();
    }

    @GetMapping("/category/{category}")
    public List<Book> getBooksByCategory(@PathVariable String category) {
        return libraryService.getBooksByCategory(category);
    }

    @PostMapping
    public Book createBook(@Valid @RequestBody Book book) {
        return libraryService.saveBook(book);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @Valid @RequestBody Book bookDetails) {
        return libraryService.getBookById(id).map(book -> {
            book.setTitle(bookDetails.getTitle());
            book.setAuthor(bookDetails.getAuthor());
            book.setIsbn(bookDetails.getIsbn());
            book.setCategory(bookDetails.getCategory());
            book.setTotalCopies(bookDetails.getTotalCopies());
            Book updatedBook = libraryService.saveBook(book);
            return ResponseEntity.ok(updatedBook);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        if (libraryService.getBookById(id).isPresent()) {
            libraryService.deleteBook(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
