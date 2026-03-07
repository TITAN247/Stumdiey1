// ... existing code ...
              <%= error %>
            </div>
          <% } %>
          <form class="row g-3" action="/register" method="post">
            <div class="col-12">
              <label for="fullName" class="form-label">Full Name</label>
              <input name="fullName" type="text" class="form-control" id="fullName" required>
            </div>
            <div class="col-md-6">
              <label for="username" class="form-label">Username</label>
              <input name="username" type="text" class="form-control" id="username" required>
            </div>
// ... existing code ...
