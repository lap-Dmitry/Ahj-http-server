const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');

const app = new Koa();

const port = process.env.PORT || 7070;

let tickets = [
  {
    id: '123-456-789',
    name: 'Test ticket with description',
    description: 'This is a test ticket description',
    status: true,
    created: new Date().toLocaleString(),
  },
  {
    id: '987-654-321',
    name: 'Test ticket without description',
    description: '',
    status: false,
    created: new Date().toLocaleString(),
  },
];

app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  }),
);

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');  
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        ctx.request.get('Access-Control-Request-Headers'),
      );
    }

    ctx.response.status = 204;
  }
});

app.use(async (ctx) => {
  ctx.response.body = `server response at port ${port}`;
  const { method } = ctx.request.query;
  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets;
      return;
    case 'ticketById':
      const ticketById = tickets.find((ticket) => ticket.id === ctx.request.query.id);
      const ticketDescription = ticketById.description;
      ctx.response.body = ticketDescription;
      return;
    case 'createTicket':
      const newTicketId = uuid.v4()
      const formData = ctx.request.body;
      formData.id = newTicketId;
      if (formData.status === 'false') formData.status = false;
      if (formData.status === 'true') formData.status = true;
      tickets.push(formData);
      return;
    case 'changeTicketStatus':
      const ticketId = tickets.find((ticket) => ticket.id === ctx.request.body.id);
      if (!ticketId) return;
      ticketId.status = ctx.request.body.status;
      return;
    case 'removeTicket':
      tickets = tickets.filter((ticket) => ticket.id !== ctx.request.body.id);
      return;
    case 'editTicket':
      const
        {
          id,
          name,
          description,
          status,
          created,
        } = ctx.request.body;
      const editingTicket = tickets.find((ticket) => ticket.id === id);
      if (!editingTicket) return;
      editingTicket.name = name;
      editingTicket.description = description;
      editingTicket.status = status;
      editingTicket.created = created;
      return;
    default:
      ctx.response.status = 404;
  }
});

app.listen(port, () => console.log(`Koa server has been started on port ${port} ...`));