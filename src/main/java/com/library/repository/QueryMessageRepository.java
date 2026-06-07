package com.library.repository;

import com.library.model.QueryMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueryMessageRepository extends JpaRepository<QueryMessage, Long> {
    List<QueryMessage> findAllByOrderByDateSentDesc();
}
