package com.library.config;

import com.library.model.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

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

    @Override
    public void run(String... args) throws Exception {
        // Only seed data if database is empty
        if (bookRepository.count() == 0 && memberRepository.count() == 0) {
            System.out.println("SEEDING INITIAL DATABASE DATA...");

            // 1. Seed Books
            Book gatsby = new Book("The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", "Fiction", 5, 5);
            Book briefHistory = new Book("A Brief History of Time", "Stephen Hawking", "9780553380163", "Science", 3, 3);
            Book steveJobs = new Book("Steve Jobs", "Walter Isaacson", "9781451648539", "Biography", 2, 2);
            Book sapiens = new Book("Sapiens", "Yuval Noah Harari", "9780062316097", "History", 4, 4);
            Book mockingbird = new Book("To Kill a Mockingbird", "Harper Lee", "9780061120084", "Fiction", 4, 4);
            Book cleanCode = new Book("Clean Code", "Robert C. Martin", "9780132350884", "Technology", 3, 3);
            Book hobbit = new Book("The Hobbit", "J.R.R. Tolkien", "9780345339683", "Fiction", 5, 5);

            bookRepository.saveAll(Arrays.asList(gatsby, briefHistory, steveJobs, sapiens, mockingbird, cleanCode, hobbit));

            // 2. Seed Members
            Member john = new Member("John Doe", "john.doe@example.com", "555-0101", "Student");
            Member jane = new Member("Jane Smith", "jane.smith@example.com", "555-0102", "Faculty");
            Member alice = new Member("Alice Johnson", "alice.johnson@example.com", "555-0103", "Regular");
            Member bob = new Member("Bob Brown", "bob.brown@example.com", "555-0104", "Student");

            memberRepository.saveAll(Arrays.asList(john, jane, alice, bob));

            // Reload from repo to get IDs
            List<Book> books = bookRepository.findAll();
            List<Member> members = memberRepository.findAll();

            Book dbJobs = books.stream().filter(b -> b.getTitle().equals("Steve Jobs")).findFirst().get();
            Book dbCleanCode = books.stream().filter(b -> b.getTitle().equals("Clean Code")).findFirst().get();
            Book dbGatsby = books.stream().filter(b -> b.getTitle().equals("The Great Gatsby")).findFirst().get();
            Book dbSapiens = books.stream().filter(b -> b.getTitle().equals("Sapiens")).findFirst().get();

            Member dbJohn = members.stream().filter(m -> m.getName().equals("John Doe")).findFirst().get();
            Member dbJane = members.stream().filter(m -> m.getName().equals("Jane Smith")).findFirst().get();
            Member dbAlice = members.stream().filter(m -> m.getName().equals("Alice Johnson")).findFirst().get();

            // 3. Seed Transactions
            // Active issue: Steve Jobs to John Doe (issued 5 days ago, due in 9 days)
            Transaction t1 = new Transaction(dbJobs, dbJohn, LocalDate.now().minusDays(5), LocalDate.now().plusDays(9));
            dbJobs.setAvailableCopies(dbJobs.getAvailableCopies() - 1);
            bookRepository.save(dbJobs);
            transactionRepository.save(t1);

            // Active issue OVERDUE: Clean Code to Jane Smith (issued 20 days ago, due 6 days ago)
            Transaction t2 = new Transaction(dbCleanCode, dbJane, LocalDate.now().minusDays(20), LocalDate.now().minusDays(6));
            dbCleanCode.setAvailableCopies(dbCleanCode.getAvailableCopies() - 1);
            bookRepository.save(dbCleanCode);
            transactionRepository.save(t2);

            // Completed transaction (no fine): John Doe borrowed Gatsby 15 days ago, returned 2 days ago
            Transaction t3 = new Transaction(dbGatsby, dbJohn, LocalDate.now().minusDays(15), LocalDate.now().minusDays(1));
            t3.setReturnDate(LocalDate.now().minusDays(2));
            t3.setFineAmount(0.0);
            t3.setFinePaid(true);
            transactionRepository.save(t3);

            // Completed transaction with fine unpaid: Alice Johnson borrowed Sapiens 22 days ago, returned 2 days ago (due 8 days ago, so 6 days overdue = $6 fine)
            Transaction t4 = new Transaction(dbSapiens, dbAlice, LocalDate.now().minusDays(22), LocalDate.now().minusDays(8));
            t4.setReturnDate(LocalDate.now().minusDays(2));
            t4.setFineAmount(6.00);
            t4.setFinePaid(false);
            transactionRepository.save(t4);

            // 4. Seed Reservations
            // Bob Brown reserves Steve Jobs
            Reservation r1 = new Reservation(dbJobs, members.stream().filter(m -> m.getName().equals("Bob Brown")).findFirst().get(), LocalDate.now().minusDays(1));
            reservationRepository.save(r1);

            // 5. Seed Queries
            QueryMessage q1 = new QueryMessage("Charlie Green", "charlie@example.com", "Late return query", "Hello, I wanted to know what is the per-day fine for returning books late. Thank you!");
            queryMessageRepository.save(q1);

            System.out.println("SEED DATA SUCCESSFULLY POPULATED.");
        }
    }
}
