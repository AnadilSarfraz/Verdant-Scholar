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
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public DepartmentsController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        {
            var result = await _context.Departments.AsNoTracking()
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    StudentCount = d.Students.Count
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDto>> GetDepartment(int id)
        {
            var dept = await _context.Departments.AsNoTracking()
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    StudentCount = d.Students.Count
                })
                .FirstOrDefaultAsync(d => d.Id == id);
            if (dept == null) return NotFound();
            return Ok(dept);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentDto>> PostDepartment(CreateDepartmentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _context.Departments.AnyAsync(d => d.Name == dto.Name)) return BadRequest("Department name already exists.");
            var dept = new Department { Name = dto.Name };
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartment), new { id = dept.Id }, new DepartmentDto { Id = dept.Id, Name = dept.Name, StudentCount = 0 });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutDepartment(int id, UpdateDepartmentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();
            if (await _context.Departments.AnyAsync(d => d.Id != id && d.Name == dto.Name)) return BadRequest("Department name already exists.");
            dept.Name = dto.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();
            if (await _context.Students.AnyAsync(s => s.DepartmentId == id)) return BadRequest("Department has students; remove students first.");
            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
