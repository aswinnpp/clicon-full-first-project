// User Management API calls
const API_BASE_URL = '/admin/api';

// Fetch users with pagination
async function fetchUsers(page = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/users?page=${page}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Fetch single user
async function fetchUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Update user
async function updateUser(userId, userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Toggle user ban status
async function toggleUserBan(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle user ban status');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling user ban:', error);
    throw error;
  }
}

// Example usage in event handlers
document.addEventListener('DOMContentLoaded', () => {
  // Update user form submission
  const updateUserForm = document.getElementById('updateUserForm');
  if (updateUserForm) {
    updateUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userId = updateUserForm.dataset.userId;
      const formData = new FormData(updateUserForm);
      const userData = Object.fromEntries(formData.entries());
      
      try {
        const result = await updateUser(userId, userData);
        if (result.success) {
          showToast('success', 'User updated successfully');
          setTimeout(() => {
            window.location.href = '/admin/usermanage';
          }, 1500);
        }
      } catch (error) {
        showToast('error', error.message);
      }
    });
  }

  // Ban/Unban user button click
  const userTable = document.querySelector('.user-table');
  if (userTable) {
    userTable.addEventListener('click', async (e) => {
      if (e.target.matches('.ban-user-btn')) {
        const userId = e.target.dataset.userId;
        try {
          const result = await toggleUserBan(userId);
          if (result.success) {
            showToast('success', result.message);
            // Update UI to reflect new ban status
            e.target.textContent = result.data.user.isBan ? 'Unban' : 'Ban';
          }
        } catch (error) {
          showToast('error', error.message);
        }
      }
    });
  }

  // Pagination click handlers
  const pagination = document.querySelector('.pagination');
  if (pagination) {
    pagination.addEventListener('click', async (e) => {
      if (e.target.matches('.page-link')) {
        e.preventDefault();
        const page = e.target.dataset.page;
        try {
          const result = await fetchUsers(page);
          if (result.success) {
            // Update the table with new user data
            updateUserTable(result.data.users);
            // Update pagination UI
            updatePagination(result.data.pagination);
          }
        } catch (error) {
          showToast('error', error.message);
        }
      }
    });
  }
});

// Helper functions
function showToast(type, message) {
  // Implement your toast notification logic here
  console.log(`${type}: ${message}`);
}

function updateUserTable(users) {
  // Implement your table update logic here
  const tbody = document.querySelector('.user-table tbody');
  if (tbody) {
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.phone || '-'}</td>
        <td>
          <button class="ban-user-btn" data-user-id="${user._id}">
            ${user.isBan ? 'Unban' : 'Ban'}
          </button>
          <a href="/admin/userupdate/${user._id}" class="edit-btn">Edit</a>
        </td>
      </tr>
    `).join('');
  }
}

function updatePagination({ currentPage, totalPages }) {
  // Implement your pagination update logic here
  const pagination = document.querySelector('.pagination');
  if (pagination) {
    pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map(page => `
        <li class="page-item ${page === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${page}</a>
        </li>
      `).join('');
  }
} 