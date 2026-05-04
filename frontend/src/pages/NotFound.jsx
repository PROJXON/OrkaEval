export default function NotFound() {
  return (
    <div className="page-center">
      <div className="login-card anim-fade-in" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '80px', margin: 0 }}>404</h1>
        <p>This page doesn't exist.</p>
        <a href="/" className="btn btn-brand" style={{ display: 'inline-block', marginTop: '24px' }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
