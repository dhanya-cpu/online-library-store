📚 Online Library Store

A full-stack **Digital Library Management System** built with **Spring Boot 3.3** and a modern HTML/CSS/JS frontend. The application provides a complete solution for managing library operations including book cataloging, member management, book issuing/returning, reservations, fine tracking, and a dashboard with reports.



 ✨ Features

 📖 Book Management
- Add, update, and delete books from the catalog
- Search books by title, author, or ISBN
- Filter books by category
- Track total and available copies per book

 👥 Member Management
- Register and manage library members
- Support for multiple membership types: **Student**, **Faculty**, **Regular**
- View individual member transaction history

🔄 Transactions (Issue & Return)
- Issue books to members with automatic due date calculation (14-day loan period)
- Return books with automatic overdue fine calculation (**$1.00 per day** overdue)
- View active issues and full transaction history
- Pay outstanding fines

 📅 Reservations / Advance Booking
- Reserve books that are currently unavailable
- Track reservation status: `PENDING`, `FULFILLED`, `CANCELLED`
- Auto-issue books when a reservation is fulfilled (if copies are available)

💬 Query / Contact System
- Submit queries via a contact form
- Simulated email notification to library admin
- Admin can view and manage all submitted queries

 📊 Dashboard & Reports
- Real-time summary dashboard with:
  - Total books and members count
  - Currently issued books
  - Overdue books count
  - Total fines collected vs. pending
  - Category-wise book distribution

---

## 🛠️ Tech Stack

| Layer        | Technology                         |
|--------------|------------------------------------|
| **Backend**  | Java 17, Spring Boot 3.3.0        |
| **ORM**      | Spring Data JPA / Hibernate        |
| **Database** | H2 (file-based, persistent)        |
| **Validation** | Jakarta Bean Validation          |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript    |
| **Build**    | Apache Maven                       |

---

## 📁 Project Structure

```
online-library-store/
├── pom.xml                                    # Maven build configuration
├── README.md
├── db/                                        # H2 database files (auto-generated)
│
└── src/
    └── main/
        ├── java/com/library/
        │   ├── LibraryApplication.java        # Spring Boot entry point
        │   │
        │   ├── config/
        │   │   └── DataInitializer.java       # Seeds sample data on first run
        │   │
        │   ├── model/
        │   │   ├── Book.java                  # Book entity
        │   │   ├── Member.java                # Library member entity
        │   │   ├── Transaction.java           # Issue/Return transaction entity
        │   │   ├── Reservation.java           # Book reservation entity
        │   │   └── QueryMessage.java          # Contact/query message entity
        │   │
        │   ├── repository/
        │   │   ├── BookRepository.java        # Book data access
        │   │   ├── MemberRepository.java      # Member data access
        │   │   ├── TransactionRepository.java # Transaction data access
        │   │   ├── ReservationRepository.java # Reservation data access
        │   │   └── QueryMessageRepository.java# Query message data access
        │   │
        │   ├── service/
        │   │   └── LibraryService.java        # Core business logic
        │   │
        │   └── controller/
        │       ├── BookController.java        # /api/books endpoints
        │       ├── MemberController.java      # /api/members endpoints
        │       ├── TransactionController.java # /api/transactions endpoints
        │       ├── ReservationController.java # /api/reservations endpoints
        │       ├── QueryController.java       # /api/queries endpoints
        │       └── ReportController.java      # /api/reports endpoints
        │
        └── resources/
            ├── application.properties         # App configuration
            └── static/
                ├── index.html                 # Main frontend page
                ├── css/                       # Stylesheets
                └── js/                        # JavaScript modules
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 17** or higher
- **Apache Maven 3.8+**

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/online-library-store.git
   cd online-library-store
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

The application will automatically seed sample data (books, members, transactions, reservations, and queries) on the first run.

---

## 🗄️ Database

The application uses an **H2 file-based database** stored in the `./db/` directory. The data persists across application restarts.

### H2 Console

Access the H2 database console for direct SQL queries:

| Setting        | Value                                        |
|----------------|----------------------------------------------|
| **URL**        | `http://localhost:8080/h2-console`           |
| **JDBC URL**   | `jdbc:h2:file:./db/librarydb`               |
| **Username**   | `sa`                                         |
| **Password**   | *(empty)*                                    |

---

## 📡 API Reference

### Books — `/api/books`

| Method   | Endpoint                    | Description                     |
|----------|-----------------------------|---------------------------------|
| `GET`    | `/api/books`                | Get all books                   |
| `GET`    | `/api/books?search={query}` | Search books by title/author/ISBN |
| `GET`    | `/api/books/{id}`           | Get book by ID                  |
| `GET`    | `/api/books/categories`     | Get all unique categories       |
| `GET`    | `/api/books/category/{cat}` | Get books by category           |
| `POST`   | `/api/books`                | Add a new book                  |
| `PUT`    | `/api/books/{id}`           | Update a book                   |
| `DELETE` | `/api/books/{id}`           | Delete a book                   |

### Members — `/api/members`

| Method   | Endpoint              | Description           |
|----------|-----------------------|-----------------------|
| `GET`    | `/api/members`        | Get all members       |
| `GET`    | `/api/members/{id}`   | Get member by ID      |
| `POST`   | `/api/members`        | Register a new member |
| `PUT`    | `/api/members/{id}`   | Update member info    |
| `DELETE` | `/api/members/{id}`   | Delete a member       |

### Transactions — `/api/transactions`

| Method   | Endpoint                               | Description                  |
|----------|----------------------------------------|------------------------------|
| `POST`   | `/api/transactions/issue`              | Issue a book to a member     |
| `POST`   | `/api/transactions/return`             | Return a book                |
| `GET`    | `/api/transactions/active`             | Get all active (unreturned) issues |
| `GET`    | `/api/transactions/history`            | Get full transaction history |
| `GET`    | `/api/transactions/member/{memberId}`  | Get transactions for a member|
| `POST`   | `/api/transactions/payfine/{id}`       | Mark fine as paid            |

**Request body for issue/return:**
```json
{
  "memberId": 1,
  "bookId": 2
}
```

### Reservations — `/api/reservations`

| Method   | Endpoint                          | Description                     |
|----------|-----------------------------------|---------------------------------|
| `POST`   | `/api/reservations`               | Create a reservation            |
| `GET`    | `/api/reservations`               | Get all reservations            |
| `GET`    | `/api/reservations/member/{id}`   | Get reservations for a member   |
| `PUT`    | `/api/reservations/{id}/status`   | Update reservation status       |

**Request body for status update:**
```json
{
  "status": "FULFILLED"
}
```

### Queries — `/api/queries`

| Method   | Endpoint            | Description             |
|----------|---------------------|-------------------------|
| `POST`   | `/api/queries`      | Submit a new query      |
| `GET`    | `/api/queries`      | Get all queries         |
| `DELETE` | `/api/queries/{id}` | Delete a query          |

### Reports — `/api/reports`

| Method   | Endpoint               | Description                |
|----------|------------------------|----------------------------|
| `GET`    | `/api/reports/summary`  | Get dashboard summary data |

---

## 🌱 Sample Data

On first startup, the following sample data is automatically loaded:

### Books (7)
| Title                      | Author                | Category   | Copies |
|----------------------------|-----------------------|------------|--------|
| The Great Gatsby           | F. Scott Fitzgerald   | Fiction    | 5      |
| A Brief History of Time   | Stephen Hawking       | Science    | 3      |
| Steve Jobs                 | Walter Isaacson       | Biography  | 2      |
| Sapiens                    | Yuval Noah Harari     | History    | 4      |
| To Kill a Mockingbird      | Harper Lee            | Fiction    | 4      |
| Clean Code                 | Robert C. Martin      | Technology | 3      |
| The Hobbit                 | J.R.R. Tolkien        | Fiction    | 5      |

### Members (4)
| Name            | Email                        | Type    |
|-----------------|------------------------------|---------|
| John Doe        | john.doe@example.com         | Student |
| Jane Smith      | jane.smith@example.com       | Faculty |
| Alice Johnson   | alice.johnson@example.com    | Regular |
| Bob Brown       | bob.brown@example.com        | Student |

### Pre-loaded Transactions
- **Active issue**: Steve Jobs → John Doe (on time)
- **Active issue (overdue)**: Clean Code → Jane Smith
- **Completed**: The Great Gatsby → John Doe (no fine)
- **Completed with fine**: Sapiens → Alice Johnson ($6.00 unpaid)

---

## ⚙️ Configuration

All configuration is in [`application.properties`](src/main/resources/application.properties):

| Property                          | Default Value                                | Description                    |
|-----------------------------------|----------------------------------------------|--------------------------------|
| `server.port`                     | `8080`                                       | Server port                    |
| `spring.datasource.url`          | `jdbc:h2:file:./db/librarydb`               | Database file location         |
| `spring.h2.console.enabled`      | `true`                                       | Enable H2 web console          |
| `spring.jpa.hibernate.ddl-auto`  | `update`                                     | Auto-create/update DB schema   |

---

## 📜 License

This project is open-source and available for educational purposes.

<img width="1919" height="877" alt="image" src="https://github.com/user-attachments/assets/a0e4120a-d21b-411b-a2a1-040ba217fdbd" />


<img width="1919" height="831" alt="image" src="https://github.com/user-attachments/assets/30467fac-c2b2-4d64-bcbd-c53b34ef14e2" />


<img width="1919" height="860" alt="image" src="https://github.com/user-attachments/assets/3387b1ef-c464-490f-860d-a5befd525c6c" />


<img width="1919" height="844" alt="image" src="https://github.com/user-attachments/assets/44efdde7-02ef-46bb-af09-efb993d5fd8b" />


<img width="1919" height="831" alt="image" src="https://github.com/user-attachments/assets/54b8c8c8-b1cc-4072-a649-3b493837f107" />

 http://localhost:8080

 
