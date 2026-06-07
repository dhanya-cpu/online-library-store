package com.library.service;

import com.library.model.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LibraryService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private QueryMessageRepository queryMessageRepository;

    // --- Book Operations ---

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    public List<Book> searchBooks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.searchBooks(query);
    }

    public List<Book> getBooksByCategory(String category) {
        return bookRepository.findByCategoryIgnoreCase(category);
    }

    public List<String> getCategories() {
        return bookRepository.findUniqueCategories();
    }

    public Book saveBook(Book book) {
        // If it's a new book, availableCopies equals totalCopies
        if (book.getId() == null) {
            book.setAvailableCopies(book.getTotalCopies());
        } else {
            // For updates, adjust available copies based on current issues
            Book existing = bookRepository.findById(book.getId()).orElse(null);
            if (existing != null) {
                int issuedCopies = existing.getTotalCopies() - existing.getAvailableCopies();
                book.setAvailableCopies(Math.max(0, book.getTotalCopies() - issuedCopies));
            }
        }
        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    // --- Member Operations ---

    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id);
    }

    public Member saveMember(Member member) {
        return memberRepository.save(member);
    }

    public void deleteMember(Long id) {
        memberRepository.deleteById(id);
    }

    // --- Borrowing / Transaction Operations ---

    @Transactional
    public Transaction issueBook(Long memberId, Long bookId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + memberId));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));

        // Check if book has available copies
        if (book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("No copies of '" + book.getTitle() + "' are currently available. Please place a reservation.");
        }

        // Check if member already has this book issued and not returned
        Optional<Transaction> activeIssue = transactionRepository
                .findFirstByBookIdAndMemberIdAndReturnDateIsNull(bookId, memberId);
        if (activeIssue.isPresent()) {
            throw new IllegalStateException("Member already has an active issue of this book.");
        }

        // Issue book: available copies decrement
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // Create transaction: due in 14 days
        LocalDate issueDate = LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(14);
        Transaction transaction = new Transaction(book, member, issueDate, dueDate);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction returnBook(Long memberId, Long bookId) {
        Transaction transaction = transactionRepository
                .findFirstByBookIdAndMemberIdAndReturnDateIsNull(bookId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("No active issue found for Book ID: " + bookId + " and Member ID: " + memberId));

        Book book = transaction.getBook();
        LocalDate returnDate = LocalDate.now();
        transaction.setReturnDate(returnDate);

        // Calculate fine ($1.00 per day overdue)
        long daysOverdue = ChronoUnit.DAYS.between(transaction.getDueDate(), returnDate);
        if (daysOverdue > 0) {
            transaction.setFineAmount(daysOverdue * 1.0);
            transaction.setFinePaid(false);
        } else {
            transaction.setFineAmount(0.0);
            transaction.setFinePaid(true);
        }

        // Increment available copies
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        // Check if there are pending reservations for this book.
        // We can automatically notify or handle, but keeping it simple for the admin.
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getActiveTransactions() {
        return transactionRepository.findByReturnDateIsNull();
    }

    public List<Transaction> getTransactionHistory() {
        return transactionRepository.findAllByOrderByIssueDateDesc();
    }

    public List<Transaction> getMemberTransactions(Long memberId) {
        return transactionRepository.findByMemberId(memberId);
    }

    @Transactional
    public Transaction payFine(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found with ID: " + transactionId));
        transaction.setFinePaid(true);
        return transactionRepository.save(transaction);
    }

    // --- Reservation / Advance Booking Operations ---

    @Transactional
    public Reservation reserveBook(Long memberId, Long bookId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + memberId));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));

        // Create reservation
        Reservation reservation = new Reservation(book, member, LocalDate.now());
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAllByOrderByReservationDateDesc();
    }

    public List<Reservation> getMemberReservations(Long memberId) {
        return reservationRepository.findByMemberId(memberId);
    }

    @Transactional
    public Reservation updateReservationStatus(Long reservationId, String status) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with ID: " + reservationId));
        
        reservation.setStatus(status.toUpperCase());
        
        // If reservation is fulfilled and book is available, we can optionally auto-issue it
        if ("FULFILLED".equalsIgnoreCase(status)) {
            Book book = reservation.getBook();
            if (book.getAvailableCopies() > 0) {
                try {
                    issueBook(reservation.getMember().getId(), book.getId());
                } catch (Exception e) {
                    // Log or handle issue failure (e.g. member already has it)
                }
            }
        }
        
        return reservationRepository.save(reservation);
    }

    // --- Query Operations ---

    public QueryMessage saveQuery(QueryMessage queryMessage) {
        // Simulate sending email: log it to console
        System.out.println("==================================================");
        System.out.println("SIMULATING EMAIL SENDING...");
        System.out.println("To: libraryadmin@digitallibrary.com");
        System.out.println("From: " + queryMessage.getSenderEmail() + " (" + queryMessage.getSenderName() + ")");
        System.out.println("Subject: " + queryMessage.getSubject());
        System.out.println("Body:\n" + queryMessage.getMessage());
        System.out.println("==================================================");

        return queryMessageRepository.save(queryMessage);
    }

    public List<QueryMessage> getAllQueries() {
        return queryMessageRepository.findAllByOrderByDateSentDesc();
    }

    public void deleteQuery(Long id) {
        queryMessageRepository.deleteById(id);
    }

    // --- Report / Dashboard Operations ---

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        long totalBooks = bookRepository.count();
        long totalMembers = memberRepository.count();
        
        List<Transaction> activeTransactions = transactionRepository.findByReturnDateIsNull();
        long issuedBooks = activeTransactions.size();

        // Calculate total fines collected vs pending
        List<Transaction> allTransactions = transactionRepository.findAll();
        double totalFinesCollected = allTransactions.stream()
                .filter(t -> t.isFinePaid() && t.getFineAmount() > 0)
                .mapToDouble(Transaction::getFineAmount)
                .sum();

        double totalFinesPending = allTransactions.stream()
                .filter(t -> !t.isFinePaid() && t.getFineAmount() > 0)
                .mapToDouble(Transaction::getFineAmount)
                .sum();

        // Count overdue books (due date before today and not returned)
        LocalDate today = LocalDate.now();
        long overdueBooksCount = activeTransactions.stream()
                .filter(t -> t.getDueDate().isBefore(today))
                .count();

        // Get category distributions
        List<Book> books = bookRepository.findAll();
        Map<String, Long> categoryDistribution = books.stream()
                .collect(Collectors.groupingBy(Book::getCategory, Collectors.counting()));

        summary.put("totalBooks", totalBooks);
        summary.put("totalMembers", totalMembers);
        summary.put("issuedBooks", issuedBooks);
        summary.put("overdueBooksCount", overdueBooksCount);
        summary.put("totalFinesCollected", totalFinesCollected);
        summary.put("totalFinesPending", totalFinesPending);
        summary.put("categoryDistribution", categoryDistribution);

        return summary;
    }
}
