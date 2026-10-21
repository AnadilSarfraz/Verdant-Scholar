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
    public class StudentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StudentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetStudents(
            [FromQuery] string? name = null,
            [FromQuery] int? minAge = null,
            [FromQuery] int? maxAge = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sort = null)
        {
            // Validate pagination parameters
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10; // Use default 10 if invalid

            var query = _context.Students.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(name))
                query = query.Where(s => s.Name.Contains(name));

            if (minAge.HasValue)
                query = query.Where(s => s.Age >= minAge.Value);

            if (maxAge.HasValue)
                query = query.Where(s => s.Age <= maxAge.Value);

            if (departmentId.HasValue)
                query = query.Where(s => s.DepartmentId == departmentId.Value);

            if (!string.IsNullOrEmpty(sort))
            {
                var sortLower = sort.ToLower();
                if (sortLower.StartsWith("-"))
                {
                    var field = sortLower.Substring(1);
                    if (field == "name")
                        query = query.OrderByDescending(s => s.Name);
                    else if (field == "age")
                        query = query.OrderByDescending(s => s.Age);
                }
                else
                {
                    if (sortLower == "name")
                        query = query.OrderBy(s => s.Name);
                    else if (sortLower == "age")
                        query = query.OrderBy(s => s.Age);
                }
            }

            var total = await query.CountAsync();
            var students = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new StudentResponseDto
                {
                    Id = s.Id, Name = s.Name, Age = s.Age, Email = s.Email,
                    DepartmentId = s.DepartmentId,
                    DepartmentName = s.Department != null ? s.Department.Name : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data = students });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StudentResponseDto>> GetStudent(int id)
        {
            var student = await _context.Students.AsNoTracking()
                .Include(s => s.Department)
                .Include(s => s.StudentSubjects).ThenInclude(ss => ss.Subject)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null) return NotFound();

            return new StudentResponseDto
            {
                Id = student.Id,
                Name = student.Name,
                Age = student.Age,
                Email = student.Email,
                DepartmentId = student.DepartmentId,
                DepartmentName = student.Department?.Name,
                Subjects = student.StudentSubjects
                    .Select(ss => new SubjectDto { Id = ss.Subject.Id, Name = ss.Subject.Name })
                    .ToList()
            };
        }

        [HttpGet("by-subject/{subjectId}")]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetStudentsBySubject(int subjectId)
        {
            var students = await _context.StudentSubjects
                .AsNoTracking()
                .Where(ss => ss.SubjectId == subjectId)
                .Select(ss => new StudentResponseDto
                {
                    Id = ss.Student.Id,
                    Name = ss.Student.Name,
                    Age = ss.Student.Age,
                    Email = ss.Student.Email
                })
                .ToListAsync();

            return students;
        }

        [HttpGet("subjects-multiple")]
        public async Task<ActionResult<IEnumerable<object>>> GetSubjectsWithMultipleStudents()
        {
            var result = await _context.StudentSubjects
                .AsNoTracking()
                .GroupBy(ss => ss.SubjectId)
                .Where(g => g.Count() > 1)
                .Select(g => new { SubjectId = g.Key, StudentCount = g.Count(), SubjectName = g.First().Subject.Name })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("count-by-department")]
        public async Task<ActionResult<IEnumerable<object>>> CountByDepartment()
        {
            var result = await _context.Students
                .AsNoTracking()
                .GroupBy(s => s.DepartmentId)
                .Select(g => new { DepartmentId = g.Key, Count = g.Count() })
                .ToListAsync();
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<StudentResponseDto>> PostStudent(CreateStudentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId))
                return BadRequest("Department not found.");

            if (await _context.Students.AnyAsync(s => s.Email == dto.Email))
                return BadRequest("Email already exists.");

            var student = new Student { Name = dto.Name, Age = dto.Age, Email = dto.Email, DepartmentId = dto.DepartmentId };
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, new StudentResponseDto { Id = student.Id, Name = student.Name, Age = student.Age, Email = student.Email });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutStudent(int id, UpdateStudentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            // Check that the department exists before modifying or saving
            if (!await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId))
                return BadRequest("Department not found.");

            student.Name = dto.Name;
            student.Age = dto.Age;
            student.Email = dto.Email;
            student.DepartmentId = dto.DepartmentId;

            try { await _context.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!_context.Students.Any(e => e.Id == id)) return NotFound(); throw; }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();
            _context.Students.Remove(student);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}