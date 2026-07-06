import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_vgpa1quw";
const TEMPLATE_ID = "template_ser08xc";
const PUBLIC_KEY = "AHv-7CIHjGTm8H4uv";

emailjs.init(PUBLIC_KEY);

export function sendDeadlineReminder(
  employeeName,
  employeeEmail,
  taskTitle,
  deadline,
  projectName
) {
  const params = {
    to_name: employeeName,
    to_email: employeeEmail,
    subject: "Task Deadline Tomorrow",
    message: `This is a reminder that your task deadline is tomorrow. 
              Please complete and mark your task as done before the deadline.`,
    task_title: taskTitle,
    project_name: projectName,
    deadline: deadline,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
}

export function sendOverdueAlert(
  leaderName,
  leaderEmail,
  taskTitle,
  deadline,
  employeeName,
  projectName
) {
  const params = {
    to_name: leaderName,
    to_email: leaderEmail,
    subject: "🚨 Overdue Task Alert",
    message: `A task assigned to ${employeeName} is overdue 
              and has not been completed yet. 
              Please follow up immediately.`,
    task_title: taskTitle,
    project_name: projectName,
    deadline: deadline,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
}

export function sendTaskCompleted(
  leaderName,
  leaderEmail,
  taskTitle,
  employeeName,
  projectName
) {
  const params = {
    to_name: leaderName,
    to_email: leaderEmail,
    subject: "✅ Task Completed",
    message: `${employeeName} has completed the task successfully.`,
    task_title: taskTitle,
    project_name: projectName,
    deadline: "N/A - Task Completed",
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
}