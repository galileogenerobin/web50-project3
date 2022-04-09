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

    // Don't submit the form; we are processing the POST request with our fetch function above
    return false;
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

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}