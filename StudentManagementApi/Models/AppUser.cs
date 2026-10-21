using Microsoft.AspNetCore.Identity;

namespace StudentManagementApi.Models
{
    /// <summary>
    /// Application user account. Inherits the standard Identity fields
    /// (Id, UserName, Email, PasswordHash, SecurityStamp, lockout, etc.).
    /// Roles are stored in the Identity role tables, not on this entity.
    /// </summary>
    public class AppUser : IdentityUser<int>
    {
    }
}
