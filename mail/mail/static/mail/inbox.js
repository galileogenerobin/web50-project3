document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded')

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
  document.getElementById('view-email-container').style.display = 'none';

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

  console.log('email sent. redirecting to sent mailbox')
  // Go to the sent mailbox
  load_mailbox('sent');
  console.log('redirected to sent mailbox');

  // TODO: Check why the page redirects to inbox instead of sent

  // Don't submit the form; we are processing the POST request with our fetch function above
  return false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.getElementById('view-email-container').style.display = 'none';

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
    // If no emails returned
    if (emails.length == 0) {
      // Display a message
      const message = document.createElement('div');
      message.innerHTML = 'No emails to display.'
      message.style.textAlign = 'center';
      message.className = 'mt-2'
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
  // If email has been read, add a new class to the container for read email
  container.className = email.read ? 'email-row read' : 'email-row';
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
    // Show the view-email-container and hide the other containers
    document.getElementById('view-email-container').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    
    // Parsing the contents of the email into individual elements
    document.getElementById('from').innerHTML = `<strong>From:</strong> ${email.sender}`;
    document.getElementById('to').innerHTML = `<strong>To:</strong> ${email.recipients.join(", ")}`;
    document.getElementById('subject').innerHTML = `<strong>Subject:</strong> ${email.subject}`;
    document.getElementById('timestamp').innerHTML = `<strong>Sent:</strong> ${email.timestamp}`;

    // Assign the click handler to the reply button
    document.getElementById('reply-btn').onclick = () => {
      replyToEmail(email);
    }

    // Archive or Unarchive button
    const currentUser = document.getElementById('user-email').innerHTML;
    const archiveBtn = document.getElementById('archive-btn');
    // If from 'Sent' mailbox, archive or unarchive does not apply; we do this by checking whether the current user = the email's sender
    archiveBtn.style.display = currentUser == email.sender ? 'none' : 'block';
    // Further, if email is already archived, the button should say 'Unarchived'
    archiveBtn.innerHTML = email.archived ? 'Unarchive' : 'Archive';
    // Assign the click handler
    archiveBtn.onclick = () => {
      changeArchiveStatus(email);
    }

    // Body of the email
    document.getElementById('email-body').innerHTML = email.body;
  }
}

// Archive or unarchive an email
function changeArchiveStatus(email) {
  // Submit a PUT request to change the archive status
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      // If email is archived, changed to unarchived and vice versa
      archived: email.archived ? false : true
    })
  })
  .then(response => {
    console.log(response);
  })

  // Reload the page (which redirects to the inbox)
  location.reload();
}

// Reply to an email
function replyToEmail(email) {
  // Change to the compose email view
  compose_email();

  // Pre-fill the recipient, subject and body elements
  document.getElementById('compose-recipients').value = email.sender;

  // Update the email subject as needed
  // Check the first three characters of the subject
  let newSubject = email.subject;
  if (!(email.subject.substring(0, 3) == 'Re:')) {
    newSubject = 'Re: ' + newSubject;
  }

  document.getElementById('compose-subject').value = newSubject;
  document.getElementById('compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body}\n---------------------------------------------------------------\n`;
}