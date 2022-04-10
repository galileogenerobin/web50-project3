document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // When the compose-form is submitted
  document.getElementById('compose-form').onsubmit = function() {
    send_email();
  };
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {
  // Grab the email values
  recipients = document.getElementById('compose-recipients').value;
  subject = document.getElementById('compose-subject').value;
  body = document.getElementById('compose-body').value;
  
  // Submit a POST request to the '/emails' path (corresponding to compose in our views.py)
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject, 
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  })

  // Go to the sent mailbox
  load_mailbox('sent');

  // TODO: Check why the page redirects to inbox instead of sent

  // Don't submit the form; we are processing the POST request with our fetch function above
  return false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = 
    `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
    <div class="email-row email-heading-inbox">
      <div class="sender-inbox">Sender</div>
      <div class="subject-inbox">Subject</div>
      <div class="timestamp-inbox">Timestamp</div>
    </div>`;

  // Fetch emails from API and display the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // console.log(emails);

    // If no emails returned
    if (emails.length == 0) {
      // Display a message
      const message = document.createElement('div');
      message.innerHTML = 'No emails to display.'
      message.style.textAlign = 'center';
      document.getElementById('emails-view').appendChild(message);
    }

    // Display the emails
    emails.forEach( email => {
      addEmailToView(email);
    })
  })
  .catch(err => {console.log(err)});

}

// Add an email object to a mailbox view
function addEmailToView(email) {
  const parentView = document.getElementById('emails-view');

  // Create HTML elements from the email data
  const container = document.createElement('div');
  if (email.read) {
    // If email has been read, add a new class to the container for read email
    container.className = 'email-row read';
  } else {
    container.className = 'email-row';
  }
  // Set the containers id equal to the email id so we can grab this value when needed
  container.id = email.id;

  // When the container is clicked, view the email
  container.onclick = () => {
    viewEmail(email.id)
  };

  const senderDiv = document.createElement('div');
  senderDiv.className = 'sender-inbox';
  senderDiv.innerHTML = email.sender;
  const subjectDiv = document.createElement('div');
  subjectDiv.className = 'subject-inbox';
  subjectDiv.innerHTML = email.subject;
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'timestamp-inbox';
  timestampDiv.innerHTML = email.timestamp;

  container.appendChild(senderDiv);
  container.appendChild(subjectDiv);
  container.appendChild(timestampDiv);

  parentView.appendChild(container);
}

// View a specific email
function viewEmail(id) {
  const parentView = document.getElementById('emails-view');

  // Get the email contents
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    // Display the email contents in the page
    display(email);

    // If we obtain a valid email, mark the email as read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true })
    })
    // If error occurred, log the error
    .catch(err => { console.log(err) });

  })
  .catch(err => {console.log(err)});

  // Display email contents in the page
  function display(email) {
    // Creating a container div for the email contents
    const emailView = document.createElement('div');
    emailView.className = 'email-container';
    
    // Parsing the contents of the email into individual elements
    // Starting with the email's metadata, we create an Array of the innerHTML values for sender, recipients, email and subject
    const emailMeta = [
      `<strong>From:</strong> ${email.sender}`,
      `<strong>To:</strong> ${email.recipients.join(", ")}`,
      `<strong>Subject:</strong> ${email.subject}`,
      `<strong>Sent:</strong> ${email.timestamp}`
    ]

    // Creating new divs for each item above
    for (value of emailMeta) {
      const div = document.createElement('div');
      div.innerHTML = value;
      emailView.appendChild(div);
    }
    const bodyDiv = document.createElement('p');
    bodyDiv.innerHTML = email.body;
    console.log(email.body);
    bodyDiv.className = 'email-body';
    emailView.append(bodyDiv);

    // Clear the parent view (i.e. the inbox div) before adding our emailView
    parentView.innerHTML = '';
    parentView.appendChild(emailView);
  }
}