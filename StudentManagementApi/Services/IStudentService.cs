namespace StudentManagementApi.Services
{
    public interface IStudentService
    {
        Task<List<Models.Student>> GetAllAsync();
        Task<Models.Student?> GetByIdAsync(int id);
        Task<Models.Student> CreateAsync(Models.Student student);
        Task UpdateAsync(Models.Student student);
        Task DeleteAsync(int id);
    }
}