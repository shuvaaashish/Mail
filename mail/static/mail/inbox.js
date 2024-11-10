document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  // function to run after submission
  document.querySelector('#compose-form').addEventListener('submit',emailsubmission);
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-props-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(message => {
      const element=document.createElement('div');
      if (message.read) {
        element.classList.add('email-info','read');
      } 
      else {
        element.classList.add('email-info','unread');
      }

      element.innerHTML = `
        <strong>From:</strong>${message.sender}<br>
        <strong>Subject:</strong>${message.subject}<br>
        <p>${message.timestamp}</p>
      `;

      element.addEventListener('click',() => {
        document.querySelector('#emails-view').style.display='none';
        document.querySelector('#compose-view').style.display='none';
        document.querySelector('#emails-props-view').style.display='block';
        fetch(`/emails/${message.id}`)
          .then(response => response.json())
          .then(email => {
            console.log(email);
            document.querySelector('#emails-props-view').innerHTML=`
              <strong>From:</strong>${email.sender}<br>
              <strong>To:</strong>${email.recipients}<br>
              <strong>Subject:</strong>${email.subject}<br>
              <strong>Body:</strong>${email.body}<br>
              <p>${email.timestamp}</p>
            `;
            if(email.read==false){
              fetch(`/emails/${message.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  read: true
                })
              })
            }
            
            archiveButton=document.createElement('button');
            archiveButton.id='archive-button';
            if (email.archived) {
              archiveButton.innerText='Unarchive';
              archiveButton.classList.add('btn','btn-danger');
            } else {
              archiveButton.innerText='Archive';
              archiveButton.classList.add('btn','btn-primary');
            }

            archiveButton.addEventListener('click', () => {
              fetch(`/emails/${message.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: !email.archived 
                })
              })
              .then(() => {
                load_mailbox('inbox'); 
              });
            });
            replyButton=document.createElement('button');
            replyButton.id='reply-button';
            replyButton.classList.add('btn','btn-secondary');
            replyButton.innerText='Reply';

            replyButton.addEventListener('click', () => {
              subject=`Re: ${email.subject}`
              if (email.subject.startsWith("Re: ")) {
                subject=email.subject; 
              }
              let body = email.body;
              if (!email.body.startsWith("On ")) {
                body = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n`;
              }
              
              document.querySelector('#compose-body').value =body;
              document.querySelector('#compose-recipients').value =email.sender;
              document.querySelector('#compose-subject').value =subject;

              composeForm = document.querySelector('#compose-form');
              composeForm.onsubmit = emailsubmission;
              document.querySelector('#emails-view').style.display='none';
              document.querySelector('#emails-props-view').style.display='none';
              document.querySelector('#compose-view').style.display='block';
            });
            document.querySelector('#emails-props-view').append(archiveButton);
            document.querySelector('#emails-props-view').append(replyButton);
          });
      });

      document.querySelector('#emails-view').append(element);
    });
  });
}

function emailsubmission(event){
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({

      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}
