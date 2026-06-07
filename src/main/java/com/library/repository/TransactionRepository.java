package com.library.repository;

import com.library.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByMemberId(Long memberId);

    List<Transaction> findByMemberIdAndReturnDateIsNull(Long memberId);

    Optional<Transaction> findFirstByBookIdAndMemberIdAndReturnDateIsNull(Long bookId, Long memberId);

    List<Transaction> findByReturnDateIsNull();

    List<Transaction> findByDueDateBeforeAndReturnDateIsNull(LocalDate date);

    List<Transaction> findAllByOrderByIssueDateDesc();
}
