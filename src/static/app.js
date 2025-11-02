document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select to avoid duplicate options when re-fetching
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="activity-desc">${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Create participants section (render items safely using textContent)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants:";
        participantsDiv.appendChild(participantsTitle);

        const participantsUl = document.createElement("ul");
        participantsUl.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            const emailSpan = document.createElement("span");
            emailSpan.textContent = p;
            li.appendChild(emailSpan);
            
            const deleteBtn = document.createElement("span");
            deleteBtn.innerHTML = "✕";
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Remove participant";
            deleteBtn.onclick = async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  {
                    method: "DELETE",
                  }
                );
                
                if (response.ok) {
                  li.remove();
                  if (participantsUl.children.length === 0) {
                    const emptyLi = document.createElement("li");
                    emptyLi.className = "participant-empty";
                    emptyLi.textContent = "No participants yet";
                    participantsUl.appendChild(emptyLi);
                  }
                } else {
                  const error = await response.json();
                  console.error("Error removing participant:", error);
                }
              } catch (error) {
                console.error("Error removing participant:", error);
              }
            };
            li.appendChild(deleteBtn);
            
            participantsUl.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-empty";
          li.textContent = "No participants yet";
          participantsUl.appendChild(li);
        }

        participantsDiv.appendChild(participantsUl);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so UI reflects the new participant without requiring a page reload
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
