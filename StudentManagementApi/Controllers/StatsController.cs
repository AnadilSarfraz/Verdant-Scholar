using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagementApi.Data;

namespace StudentManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public StatsController(ApplicationDbContext context) => _context = context;

        [HttpGet("overview")]
        public async Task<ActionResult<object>> Overview()
        {
            var students = await _context.Students.AsNoTracking().CountAsync();
            var departments = await _context.Departments.AsNoTracking().CountAsync();
            var subjects = await _context.Subjects.AsNoTracking().CountAsync();
            var enrollments = await _context.StudentSubjects.AsNoTracking().CountAsync();
            return Ok(new { students, departments, subjects, enrollments });
        }

        [HttpGet("enrollments-by-student")]
        public async Task<ActionResult<IEnumerable<object>>> EnrollmentsByStudent()
        {
            var result = await _context.StudentSubjects.AsNoTracking()
                .GroupBy(ss => ss.StudentId)
                .Select(g => new { StudentId = g.Key, EnrollmentCount = g.Count() })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("students-by-department")]
        public async Task<ActionResult<IEnumerable<object>>> StudentsByDepartment()
        {
            var result = await _context.Departments.AsNoTracking()
                .Select(d => new { department = d.Name, count = d.Students.Count })
                .ToListAsync();
            return Ok(result);
        }
    }
}
