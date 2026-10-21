using Microsoft.AspNetCore.Identity;

namespace StudentManagementApi.Models
{
    /// <summary>
    /// Application role. The two roles used by this system are "Admin" and "Teacher".
    /// Uses an int key so it matches the int key on <see cref="AppUser"/>.
    /// </summary>
    public class AppRole : IdentityRole<int>
    {
        public AppRole()
        {
        }

        public AppRole(string name) : base(name)
        {
        }
    }
}
