using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagementApi.Data;
using StudentManagementApi.Models;
using StudentManagementApi.Models.DTOs;

namespace StudentManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public EnrollmentsController(ApplicationDbContext context) => _context = context;

        [HttpGet("by-student/{studentId}")]
        public async Task<ActionResult<IEnumerable<SubjectDto>>> GetByStudent(int studentId)
        {
            var subjects = await _context.StudentSubjects.AsNoTracking()
                .Where(ss => ss.StudentId == studentId)
                .Select(ss => new SubjectDto { Id = ss.Subject.Id, Name = ss.Subject.Name, StudentCount = 0 })
                .ToListAsync();
            return Ok(subjects);
        }

        [HttpGet("by-subject/{subjectId}")]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetBySubject(int subjectId)
        {
            var students = await _context.StudentSubjects.AsNoTracking()
                .Where(ss => ss.SubjectId == subjectId)
                .Select(ss => new StudentResponseDto { Id = ss.Student.Id, Name = ss.Student.Name, Age = ss.Student.Age, Email = ss.Student.Email })
                .ToListAsync();
            return Ok(students);
        }

        [HttpPost]
        public async Task<IActionResult> PostEnrollment([FromBody] EnrollmentCreateDto dto)
        {
            if (await _context.Students.FindAsync(dto.StudentId) == null) return BadRequest("Student not found.");
            if (await _context.Subjects.FindAsync(dto.SubjectId) == null) return BadRequest("Subject not found.");
            if (await _context.StudentSubjects.AnyAsync(ss => ss.StudentId == dto.StudentId && ss.SubjectId == dto.SubjectId)) return BadRequest("Enrollment already exists.");
            _context.StudentSubjects.Add(new StudentSubject { StudentId = dto.StudentId, SubjectId = dto.SubjectId });
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{studentId}/{subjectId}")]
        public async Task<IActionResult> DeleteEnrollment(int studentId, int subjectId)
        {
            var en = await _context.StudentSubjects.FirstOrDefaultAsync(ss => ss.StudentId == studentId && ss.SubjectId == subjectId);
            if (en == null) return NotFound();
            _context.StudentSubjects.Remove(en);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class EnrollmentCreateDto
    {
        public int StudentId { get; set; }
        public int SubjectId { get; set; }
    }
}
