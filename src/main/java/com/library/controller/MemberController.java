package com.library.controller;

import com.library.model.Member;
import com.library.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
@Validated
public class MemberController {

    @Autowired
    private LibraryService libraryService;

    @GetMapping
    public List<Member> getAllMembers() {
        return libraryService.getAllMembers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable Long id) {
        return libraryService.getMemberById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Member createMember(@Valid @RequestBody Member member) {
        return libraryService.saveMember(member);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Member> updateMember(@PathVariable Long id, @Valid @RequestBody Member memberDetails) {
        return libraryService.getMemberById(id).map(member -> {
            member.setName(memberDetails.getName());
            member.setEmail(memberDetails.getEmail());
            member.setPhone(memberDetails.getPhone());
            member.setMembershipType(memberDetails.getMembershipType());
            Member updatedMember = libraryService.saveMember(member);
            return ResponseEntity.ok(updatedMember);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        if (libraryService.getMemberById(id).isPresent()) {
            libraryService.deleteMember(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
