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
    public class SubjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public SubjectsController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SubjectDto>>> GetSubjects()
        {
            var result = await _context.Subjects.AsNoTracking()
                .Select(s => new SubjectDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    StudentCount = s.StudentSubjects.Count
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SubjectDto>> GetSubject(int id)
        {
            var sub = await _context.Subjects.AsNoTracking()
                .Select(s => new SubjectDto { Id = s.Id, Name = s.Name, StudentCount = s.StudentSubjects.Count })
                .FirstOrDefaultAsync(s => s.Id == id);
            if (sub == null) return NotFound();
            return Ok(sub);
        }

        [HttpPost]
        public async Task<ActionResult<SubjectDto>> PostSubject(CreateSubjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _context.Subjects.AnyAsync(s => s.Name == dto.Name)) return BadRequest("Subject name already exists.");
            var sub = new Subject { Name = dto.Name };
            _context.Subjects.Add(sub);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSubject), new { id = sub.Id }, new SubjectDto { Id = sub.Id, Name = sub.Name, StudentCount = 0 });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSubject(int id, UpdateSubjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var sub = await _context.Subjects.FindAsync(id);
            if (sub == null) return NotFound();
            if (await _context.Subjects.AnyAsync(s => s.Id != id && s.Name == dto.Name)) return BadRequest("Subject name already exists.");
            sub.Name = dto.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubject(int id)
        {
            var sub = await _context.Subjects.FindAsync(id);
            if (sub == null) return NotFound();
            if (await _context.StudentSubjects.AnyAsync(ss => ss.SubjectId == id)) return BadRequest("Subject has enrollments; remove enrollments first.");
            _context.Subjects.Remove(sub);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
