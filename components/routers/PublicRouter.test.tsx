import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PublicRouter } from './PublicRouter';
import React from 'react';

// Mock child components
vi.mock('../Home', () => ({ Home: () => <div data-testid="home">Home</div> }));
vi.mock('../PressKit', () => ({ PressKit: () => <div data-testid="press-kit">PressKit</div> }));
vi.mock('../Donors', () => ({ Donors: () => <div data-testid="donors">Donors</div> }));
vi.mock('../Blog', () => ({ Blog: () => <div data-testid="blog">Blog</div> }));
vi.mock('../BlogPostDetail', () => ({ BlogPostDetail: () => <div data-testid="blog-post-detail">BlogPostDetail</div> }));
vi.mock('../AdoptionCenter', () => ({ AdoptionCenter: () => <div data-testid="adoption-center">AdoptionCenter</div> }));
vi.mock('../PaymentSuccess', () => ({ PaymentSuccess: () => <div data-testid="payment-success">PaymentSuccess</div> }));

describe('PublicRouter', () => {
    const defaultProps = {
        currentView: 'home' as any,
        setView: vi.fn(),
        lostPets: [],
        petsForAdoption: [],
        donations: [],
        selectedPost: null,
        setSelectedPost: vi.fn(),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        setIsLoginModalOpen: vi.fn()
    };

    it('renders Home by default', () => {
        render(<PublicRouter {...defaultProps} />);
        expect(screen.getByTestId('home')).toBeInTheDocument();
    });

    it('renders PressKit for pressKit view', () => {
        render(<PublicRouter {...defaultProps} currentView="pressKit" />);
        expect(screen.getByTestId('press-kit')).toBeInTheDocument();
    });

    it('renders Donors for donors view', () => {
        render(<PublicRouter {...defaultProps} currentView="donors" />);
        expect(screen.getByTestId('donors')).toBeInTheDocument();
    });

    it('renders Blog for blog view', () => {
        render(<PublicRouter {...defaultProps} currentView="blog" />);
        expect(screen.getByTestId('blog')).toBeInTheDocument();
    });

    it('renders BlogPostDetail for blogPost view if selectedPost exists', () => {
        const post = { id: '1', title: 'Test Post' } as any;
        render(<PublicRouter {...defaultProps} currentView="blogPost" selectedPost={post} />);
        expect(screen.getByTestId('blog-post-detail')).toBeInTheDocument();
    });

    it('renders AdoptionCenter for adoptionCenter view', () => {
        render(<PublicRouter {...defaultProps} currentView="adoptionCenter" />);
        expect(screen.getByTestId('adoption-center')).toBeInTheDocument();
    });

    it('renders PaymentSuccess for paymentSuccess view', () => {
        render(<PublicRouter {...defaultProps} currentView="paymentSuccess" />);
        expect(screen.getByTestId('payment-success')).toBeInTheDocument();
    });
});
